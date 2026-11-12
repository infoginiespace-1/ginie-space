import { Router, Request, Response } from "express";
import { IDatabase, BusinessProfile } from "@giniespace/sheets-db";
import { generateQrDataUrl, WhatsAppSessionManager } from "@giniespace/whatsapp-engine";
import { Server } from "socket.io";
import { NotificationService } from "../services/notification.service";
import { normalizePhoneDigits, toE164 } from "../utils/phone";

async function resolveStoreOwner(
  db: IDatabase,
  storeIdOrSlug: string
): Promise<{ storeId: string; business: BusinessProfile | null } | null> {
  const clean = String(storeIdOrSlug || "").trim();
  if (!clean) return null;

  let business = await db.businesses.findOne({ userId: clean }).catch(() => null);
  if (business) {
    return { storeId: business.userId, business };
  }

  // Fallback check custom slug
  const allBusinesses = await db.businesses.findMany().catch(() => []);
  const bySlug = allBusinesses.find(
    (b) => b.slug && b.slug.toLowerCase() === clean.toLowerCase()
  );
  if (bySlug) {
    return { storeId: bySlug.userId, business: bySlug };
  }

  const owner = await db.users.findById(clean).catch(() => null);
  if (owner) {
    return { storeId: owner.id, business: null };
  }
  return null;
}

function buildUpiUri(params: {
  pa: string;
  pn?: string;
  am?: number;
  tn?: string;
}): string {
  const qs = new URLSearchParams();
  qs.set("pa", params.pa);
  if (params.pn) qs.set("pn", params.pn);
  if (params.am && params.am > 0) qs.set("am", Number(params.am).toFixed(2));
  qs.set("cu", "INR");
  if (params.tn) qs.set("tn", params.tn);
  return `upi://pay?${qs.toString()}`;
}

export function createStorefrontRouter(
  db: IDatabase,
  io: Server,
  notificationService?: NotificationService,
  waManager?: WhatsAppSessionManager
): Router {
  const router = Router();

  // Public UPI QR Code generator for Invoices & Payment Reminders
  router.get("/upi-qr", async (req: Request, res: Response): Promise<void> => {
    try {
      const pa = String(req.query.pa || "").trim();
      if (!pa || !pa.includes("@")) {
        res.status(400).json({ error: "Valid UPI ID (pa) is required" });
        return;
      }
      const pn = req.query.pn ? String(req.query.pn).trim() : "Merchant";
      const am = req.query.am ? Number(req.query.am) : undefined;
      const tn = req.query.tn ? String(req.query.tn).trim() : "Order Payment";

      const upiUri = buildUpiUri({ pa, pn, am, tn });
      const qrDataUrl = await generateQrDataUrl(upiUri);
      res.json({ upiUri, qrDataUrl });
    } catch {
      res.status(500).json({ error: "Could not generate UPI QR code" });
    }
  });

  // Public Storefront catalog fetch by merchant userId OR custom slug
  router.get("/:storeId", async (req: Request, res: Response): Promise<void> => {
    try {
      const storeIdParam = String(req.params.storeId || "").trim();
      const resolved = await resolveStoreOwner(db, storeIdParam);
      if (!resolved) {
        res.status(404).json({ error: "Storefront not found" });
        return;
      }
      const { storeId, business } = resolved;

      const [owner, products] = await Promise.all([
        db.users.findById(storeId),
        db.products.findMany({ userId: storeId }),
      ]);

      let parsedSettings: {
        upiId?: string;
        gstin?: string;
        gstRate?: number;
        deliveryFee?: number;
        coupons?: Array<{ code: string; discountPercent: number }>;
        logoUrl?: string;
        isOpen?: boolean;
        closedMessage?: string;
      } = {};
      if (business?.settingsJson) {
        try {
          parsedSettings = JSON.parse(business.settingsJson);
        } catch {}
      }

      res.json({
        store: {
          id: storeId,
          slug: business?.slug || "",
          name: business?.name || owner?.name || "GinieSpace Store",
          phone: business?.phone || "",
          address: business?.address || "",
          businessType: owner?.businessType || "retail",
          upiId: parsedSettings.upiId || "",
          gstin: parsedSettings.gstin || "",
          deliveryFee: Number(parsedSettings.deliveryFee) || 0,
          coupons: Array.isArray(parsedSettings.coupons) ? parsedSettings.coupons : [],
          logoUrl: parsedSettings.logoUrl || "",
          isOpen: parsedSettings.isOpen !== false,
          closedMessage: parsedSettings.closedMessage || "Store is currently closed for orders. Please check back later.",
        },
        products,
      });
    } catch {
      res.status(500).json({ error: "Could not load storefront" });
    }
  });

  // Public customer order status lookup by WhatsApp phone & optional Order ID
  router.get("/:storeId/track", async (req: Request, res: Response): Promise<void> => {
    try {
      const resolved = await resolveStoreOwner(db, String(req.params.storeId || "").trim());
      if (!resolved) {
        res.status(404).json({ error: "Storefront not found" });
        return;
      }
      const storeId = resolved.storeId;
      const phoneRaw = String(req.query.phone || "").trim();
      const orderIdQuery = String(req.query.orderId || "").trim().toLowerCase().replace(/^#/, "");

      const phoneDigits = normalizePhoneDigits(phoneRaw);
      if (!storeId || !phoneDigits || phoneDigits.length < 10) {
        res.status(400).json({ error: "Please enter a valid 10-digit WhatsApp mobile number" });
        return;
      }

      const orders = await db.orders.findMany({ userId: storeId });
      const matching = orders
        .filter((o) => {
          const orderDigits = normalizePhoneDigits(o.customerPhone || "");
          const phoneMatches = orderDigits.slice(-10) === phoneDigits.slice(-10);
          if (!phoneMatches) return false;
          if (!orderIdQuery) return true;
          return o.id.toLowerCase().endsWith(orderIdQuery) || o.id.toLowerCase() === orderIdQuery;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((o) => ({
          id: o.id,
          customerName: o.customerName,
          itemsJson: o.itemsJson,
          totalAmount: o.totalAmount,
          status: o.status,
          paymentStatus: o.paymentStatus || "unpaid",
          paidAmount: o.paidAmount || 0,
          discountAmount: o.discountAmount || 0,
          deliveryCharge: o.deliveryCharge || 0,
          couponCode: o.couponCode || "",
          createdAt: o.createdAt,
        }));

      res.json({ orders: matching });
    } catch {
      res.status(500).json({ error: "Could not track orders right now" });
    }
  });

  // Public Storefront customer order submission
  router.post("/:storeId/orders", async (req: Request, res: Response): Promise<void> => {
    try {
      const resolved = await resolveStoreOwner(db, String(req.params.storeId || "").trim());
      const { customerName, customerPhone, items, notes, couponCode, deliveryAddress } = req.body;

      if (!resolved || !customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: "Customer name, WhatsApp phone, and at least one item are required" });
        return;
      }
      const { storeId, business } = resolved;

      const phoneDigits = normalizePhoneDigits(customerPhone);
      if (!phoneDigits || phoneDigits.length < 10) {
        res.status(400).json({ error: "Please enter a valid 10-digit WhatsApp mobile number" });
        return;
      }

      if (business?.settingsJson) {
        try {
          const sjCheck = JSON.parse(business.settingsJson);
          if (sjCheck.isOpen === false) {
            res.status(400).json({ error: sjCheck.closedMessage || "Store is currently closed and not accepting orders right now." });
            return;
          }
        } catch {}
      }

      const [storeProducts, existingCustomers] = await Promise.all([
        db.products.findMany({ userId: storeId }),
        db.customers.findMany({ userId: storeId }),
      ]);

      if (!business && storeProducts.length === 0) {
        res.status(404).json({ error: "Store not found" });
        return;
      }

      const productMap = new Map(storeProducts.map((p) => [p.id, p]));
      const verifiedItems: Array<{ productId: string; name: string; price: number; unit: string; quantity: number }> = [];
      let totalAmount = 0;

      for (const reqItem of items) {
        const prod = productMap.get(String(reqItem.productId || ""));
        if (!prod) continue;
        const minQty = Math.max(1, Number(prod.minOrderQty) || 1);
        const qty = Math.max(minQty, Math.floor(Number(reqItem.quantity) || 0));
        verifiedItems.push({
          productId: prod.id,
          name: prod.name,
          price: Number(prod.price) || 0,
          unit: prod.unit || "pcs",
          quantity: qty,
        });
        totalAmount += (Number(prod.price) || 0) * qty;
      }

      if (verifiedItems.length === 0) {
        res.status(400).json({ error: "No valid catalog items selected" });
        return;
      }

      let deliveryCharge = 0;
      let discountAmount = 0;
      let appliedCoupon = "";
      if (business?.settingsJson) {
        try {
          const sj = JSON.parse(business.settingsJson);
          deliveryCharge = Math.max(0, Number(sj.deliveryFee) || 0);
          if (couponCode && Array.isArray(sj.coupons)) {
            const cleanCode = String(couponCode).trim().toUpperCase();
            const matchedCoupon = sj.coupons.find(
              (c: any) => String(c.code || "").trim().toUpperCase() === cleanCode
            );
            if (matchedCoupon && Number(matchedCoupon.discountPercent) > 0) {
              const pct = Math.min(90, Math.max(0, Number(matchedCoupon.discountPercent)));
              discountAmount = Math.round((totalAmount * pct) / 100);
              appliedCoupon = cleanCode;
            }
          }
        } catch {}
      }

      totalAmount = Math.max(0, totalAmount - discountAmount + deliveryCharge);

      // Auto-register customer if not already in store's directory
      const e164Phone = toE164(phoneDigits);
      let matchedCustomer = existingCustomers.find(
        (c) => normalizePhoneDigits(c.phone) === phoneDigits
      );

      if (!matchedCustomer) {
        try {
          matchedCustomer = await db.customers.create({
            userId: storeId,
            name: customerName.trim(),
            phone: e164Phone,
            tags: "Online Store",
          });
          io.to(`user:${storeId}`).emit("customer:created", matchedCustomer);
        } catch {}
      }

      // Create the order
      const order = await db.orders.create({
        userId: storeId,
        customerId: matchedCustomer?.id || "",
        customerName: customerName.trim(),
        customerPhone: e164Phone,
        itemsJson: JSON.stringify(verifiedItems),
        totalAmount,
        status: "pending",
        paymentStatus: "unpaid",
        paidAmount: 0,
        discountAmount,
        deliveryCharge,
        couponCode: appliedCoupon || undefined,
        deliveryAddress: deliveryAddress ? String(deliveryAddress).trim() : undefined,
        notes: notes ? `[Online Store] ${notes.trim()}` : "[Online Store Order]",
      });

      // Decrement product stock safely in background
      for (const vi of verifiedItems) {
        const prod = productMap.get(vi.productId);
        if (prod && Number(prod.stock) > 0) {
          const nextStock = Math.max(0, Number(prod.stock) - vi.quantity);
          db.products.update(prod.id, { stock: nextStock }).catch(() => {});
        }
      }

      io.to(`user:${storeId}`).emit("order:created", order);

      if (notificationService && order.customerPhone) {
        notificationService.notifyOrderPlaced(order, order.customerPhone).catch(() => {});
      }

      // Send rich receipt directly from merchant's own WhatsApp if linked
      if (waManager && waManager.getSessionState(storeId).status === "connected") {
        const lines = verifiedItems.map((it) => `  • ${it.name} × ${it.quantity} = ₹${(it.price * it.quantity).toLocaleString("en-IN")}`).join("\n");
        const receipt =
          `🛍️ *Order Received — ${business?.name || "Our Store"}*\n` +
          `Order ID: *#${order.id.slice(-6).toUpperCase()}*\n` +
          `Customer: ${order.customerName}\n` +
          (deliveryAddress ? `📍 Delivery: ${String(deliveryAddress).trim()}\n` : "") +
          `\n${lines}\n` +
          (discountAmount > 0 ? `🎟️ Discount: -₹${discountAmount}\n` : "") +
          (deliveryCharge > 0 ? `🚚 Delivery: +₹${deliveryCharge}\n` : "") +
          `\n💰 *Payable Total: ₹${totalAmount.toLocaleString("en-IN")}*\n` +
          `Track live status: https://app.ginie.space/shop/${business?.slug || storeId}`;
        waManager.sendMessage({ userId: storeId, recipientPhone: phoneDigits, messageText: receipt }).catch(() => {});
      }

      let upiUri: string | undefined;
      let qrDataUrl: string | undefined;
      if (business?.settingsJson) {
        try {
          const sj = JSON.parse(business.settingsJson);
          if (sj.upiId && String(sj.upiId).includes("@")) {
            upiUri = buildUpiUri({
              pa: sj.upiId.trim(),
              pn: business.name || "Store",
              am: totalAmount,
              tn: `Order #${order.id.slice(-6)}`,
            });
            qrDataUrl = await generateQrDataUrl(upiUri);
          }
        } catch {}
      }

      res.status(201).json({
        order,
        upiUri,
        qrDataUrl,
        message: "Order placed successfully!",
      });
    } catch {
      res.status(500).json({ error: "Could not place storefront order" });
    }
  });

  return router;
}
