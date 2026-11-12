import { Router, Request, Response } from "express";
import { IDatabase } from "@giniespace/sheets-db";
import { generateQrDataUrl } from "@giniespace/whatsapp-engine";
import { Server } from "socket.io";
import { NotificationService } from "../services/notification.service";
import { normalizePhoneDigits, toE164 } from "../utils/phone";

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
  notificationService?: NotificationService
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

  // Public Storefront catalog fetch by merchant userId
  router.get("/:storeId", async (req: Request, res: Response): Promise<void> => {
    try {
      const storeId = String(req.params.storeId || "").trim();
      if (!storeId) {
        res.status(400).json({ error: "Store ID is required" });
        return;
      }

      const [business, owner, products] = await Promise.all([
        db.businesses.findOne({ userId: storeId }),
        db.users.findById(storeId),
        db.products.findMany({ userId: storeId }),
      ]);

      if (!business && !owner) {
        res.status(404).json({ error: "Storefront not found" });
        return;
      }

      let parsedSettings: { upiId?: string; gstin?: string; gstRate?: number } = {};
      if (business?.settingsJson) {
        try {
          parsedSettings = JSON.parse(business.settingsJson);
        } catch {}
      }

      res.json({
        store: {
          id: storeId,
          name: business?.name || owner?.name || "GinieSpace Store",
          phone: business?.phone || "",
          address: business?.address || "",
          businessType: owner?.businessType || "retail",
          upiId: parsedSettings.upiId || "",
          gstin: parsedSettings.gstin || "",
        },
        products,
      });
    } catch {
      res.status(500).json({ error: "Could not load storefront" });
    }
  });

  // Public Storefront customer order submission
  router.post("/:storeId/orders", async (req: Request, res: Response): Promise<void> => {
    try {
      const storeId = String(req.params.storeId || "").trim();
      const { customerName, customerPhone, items, notes } = req.body;

      if (!storeId || !customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: "Customer name, WhatsApp phone, and at least one item are required" });
        return;
      }

      const phoneDigits = normalizePhoneDigits(customerPhone);
      if (!phoneDigits || phoneDigits.length < 10) {
        res.status(400).json({ error: "Please enter a valid 10-digit WhatsApp mobile number" });
        return;
      }

      const [business, storeProducts, existingCustomers] = await Promise.all([
        db.businesses.findOne({ userId: storeId }),
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
        const qty = Math.max(1, Math.floor(Number(reqItem.quantity) || 0));
        const prod = productMap.get(String(reqItem.productId || ""));
        if (!prod) continue;
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
