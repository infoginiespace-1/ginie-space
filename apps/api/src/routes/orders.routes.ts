import { Router, Request, Response } from "express";
import { IDatabase, OrderStatus, PaymentStatus } from "@giniespace/sheets-db";
import { Server } from "socket.io";
import { WhatsAppSessionManager } from "@giniespace/whatsapp-engine";
import { NotificationService } from "../services/notification.service";
import { normalizePhoneDigits, toE164 } from "../utils/phone";
import { requireOwnerOrAdmin } from "../middleware/auth";

export function createOrdersRouter(
  db: IDatabase,
  io: Server,
  waManager: WhatsAppSessionManager,
  notificationService?: NotificationService
): Router {
  const router = Router();

  router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const filter = req.user?.role === "admin" ? undefined : { userId: req.user!.id };
      const orders = await db.orders.findMany(filter);
      res.json({ orders });
    } catch {
      res.status(500).json({ error: "Could not load orders" });
    }
  });

  router.get("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const order = await db.orders.findById((req.params.id as string));
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      if (req.user?.role !== "admin" && order.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      res.json({ order });
    } catch {
      res.status(500).json({ error: "Could not load order" });
    }
  });

  router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, customerName, customerPhone, items, totalAmount, notes, paymentStatus, paidAmount, discountAmount, deliveryCharge, couponCode, deliveryAddress } = req.body;

      if (!customerName || !customerPhone) {
        res.status(400).json({ error: "Customer name and phone number are required" });
        return;
      }

      const parsedItems = Array.isArray(items) ? items : [];
      if (totalAmount === undefined && parsedItems.length === 0) {
        res.status(400).json({ error: "Total amount or catalog items are required" });
        return;
      }

      let resolvedItems: any[] = parsedItems;
      const cleanDiscount = Math.max(0, Number(discountAmount) || 0);
      const cleanDelivery = Math.max(0, Number(deliveryCharge) || 0);
      let resolvedTotal = Number(totalAmount) || 0;

      // Verify itemized products, compute total if not manually provided, and decrement stock
      if (parsedItems.length > 0) {
        const userProducts = await db.products.findMany({ userId: req.user!.id });
        const productMap = new Map(userProducts.map((p) => [p.id, p]));
        let computedItemsTotal = 0;

        resolvedItems = parsedItems.map((it: any) => {
          const prod = productMap.get(String(it.productId || ""));
          const qty = Math.max(1, Number(it.quantity) || 1);
          const unitPrice = prod ? Number(prod.price) : Number(it.price) || 0;
          computedItemsTotal += unitPrice * qty;

          if (prod && Number(prod.stock) > 0) {
            const nextStock = Math.max(0, Number(prod.stock) - qty);
            db.products.update(prod.id, { stock: nextStock }).catch(() => {});
          }

          return {
            productId: prod?.id || it.productId || "",
            name: prod?.name || it.name || "Item",
            price: unitPrice,
            unit: prod?.unit || it.unit || "pcs",
            quantity: qty,
          };
        });

        if (totalAmount === undefined || Number(totalAmount) <= 0) {
          resolvedTotal = Math.max(0, computedItemsTotal - cleanDiscount + cleanDelivery);
        }
      }

      // Auto-link or create customer in merchant's directory
      const e164Phone = toE164(customerPhone) || customerPhone.trim();
      const digits = normalizePhoneDigits(e164Phone);
      let resolvedCustomerId = customerId || "";
      if (!resolvedCustomerId && digits) {
        try {
          const existingCusts = await db.customers.findMany({ userId: req.user!.id });
          const matched = existingCusts.find((c) => normalizePhoneDigits(c.phone || "") === digits);
          if (matched) {
            resolvedCustomerId = matched.id;
          } else {
            const createdCust = await db.customers.create({
              userId: req.user!.id,
              name: customerName.trim(),
              phone: e164Phone,
              tags: "Order Customer",
            });
            resolvedCustomerId = createdCust.id;
            io.to(`user:${req.user!.id}`).emit("customer:created", createdCust);
          }
        } catch {}
      }

      const validPayStatuses: PaymentStatus[] = ["unpaid", "partial", "paid"];
      const resolvedPayStatus: PaymentStatus = validPayStatuses.includes(paymentStatus) ? paymentStatus : "unpaid";
      const resolvedPaidAmount =
        resolvedPayStatus === "paid"
          ? resolvedTotal
          : resolvedPayStatus === "unpaid"
          ? 0
          : Math.min(resolvedTotal, Math.max(0, Number(paidAmount) || 0));

      const order = await db.orders.create({
        userId: req.user!.id,
        customerId: resolvedCustomerId,
        customerName: customerName.trim(),
        customerPhone: e164Phone,
        itemsJson: typeof items === "string" ? items : JSON.stringify(resolvedItems),
        totalAmount: resolvedTotal,
        status: "pending",
        notes: notes ? notes.trim() : undefined,
        paymentStatus: resolvedPayStatus,
        paidAmount: resolvedPaidAmount,
        discountAmount: cleanDiscount,
        deliveryCharge: cleanDelivery,
        couponCode: couponCode ? String(couponCode).trim().toUpperCase() : undefined,
        deliveryAddress: deliveryAddress ? String(deliveryAddress).trim() : undefined,
      });

      io.to(`user:${req.user!.id}`).emit("order:created", order);

      if (notificationService && order.customerPhone) {
        notificationService.notifyOrderPlaced(order, order.customerPhone).catch(() => {});
      }

      res.status(201).json({ order, message: "Order placed successfully" });
    } catch {
      res.status(500).json({ error: "Could not place order" });
    }
  });

  router.put("/:id/status", async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, notifyCustomer } = req.body;
      const validStatuses: OrderStatus[] = ["pending", "confirmed", "dispatched", "delivered", "cancelled"];

      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
        return;
      }

      const existing = await db.orders.findById((req.params.id as string));
      if (!existing) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const updated = await db.orders.update((req.params.id as string), {
        status: status as OrderStatus,
      });

      // Automatically restock inventory when cancelling a non-cancelled itemized order (and re-deduct if un-cancelling)
      const becomingCancelled = existing.status !== "cancelled" && status === "cancelled";
      const unCancelling = existing.status === "cancelled" && status !== "cancelled";
      if (becomingCancelled || unCancelling) {
        try {
          const ordItems = JSON.parse(existing.itemsJson || "[]");
          if (Array.isArray(ordItems) && ordItems.length > 0) {
            const userProducts = await db.products.findMany({ userId: existing.userId });
            const prodMap = new Map(userProducts.map((p) => [p.id, p]));
            for (const item of ordItems) {
              const prod = item.productId ? prodMap.get(String(item.productId)) : undefined;
              const qty = Math.max(1, Number(item.quantity) || 1);
              if (prod) {
                const nextStock = becomingCancelled
                  ? Number(prod.stock || 0) + qty
                  : Math.max(0, Number(prod.stock || 0) - qty);
                const updatedProd = await db.products.update(prod.id, { stock: nextStock }).catch(() => null);
                if (updatedProd) {
                  io.to(`user:${existing.userId}`).emit("product:updated", updatedProd);
                }
              }
            }
          }
        } catch {}
      }

      io.to(`user:${existing.userId}`).emit("order:updated", updated);
      io.to(`user:${existing.userId}`).emit("order:status_changed", {
        orderId: existing.id,
        status,
        customerName: existing.customerName,
      });

      if (notifyCustomer && existing.customerPhone) {
        const statusFriendlyNames: Record<string, string> = {
          pending: "received and is pending confirmation",
          confirmed: "confirmed and being prepared",
          dispatched: "dispatched and on its way",
          delivered: "delivered. Thank you for your business!",
          cancelled: "cancelled",
        };
        const messageText = `Hello ${existing.customerName}! Your order #${existing.id.slice(-6)} has been ${statusFriendlyNames[status]}. Total: ₹${existing.totalAmount}`;
        const merchantState = waManager.getSessionState(existing.userId);
        if (merchantState.status === "connected") {
          waManager.sendMessage({
            userId: existing.userId,
            recipientPhone: existing.customerPhone,
            messageText,
          }).catch(() => {});
        } else if (notificationService) {
          notificationService.sendSupportNotification(existing.customerPhone, messageText).catch(() => {});
        }
      }

      res.json({ order: updated, message: `Order status updated to ${status}` });
    } catch {
      res.status(500).json({ error: "Could not update order status" });
    }
  });

  router.put("/:id/payment", async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentStatus, paidAmount } = req.body;
      const validPayStatuses: PaymentStatus[] = ["unpaid", "partial", "paid"];
      if (!paymentStatus || !validPayStatuses.includes(paymentStatus)) {
        res.status(400).json({ error: `Payment status must be one of: ${validPayStatuses.join(", ")}` });
        return;
      }

      const existing = await db.orders.findById((req.params.id as string));
      if (!existing) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const total = Number(existing.totalAmount) || 0;
      const nextPaid =
        paymentStatus === "paid"
          ? total
          : paymentStatus === "unpaid"
          ? 0
          : Math.min(total, Math.max(0, Number(paidAmount) || 0));

      const updated = await db.orders.update((req.params.id as string), {
        paymentStatus: paymentStatus as PaymentStatus,
        paidAmount: nextPaid,
      });

      io.to(`user:${existing.userId}`).emit("order:updated", updated);
      res.json({ order: updated, message: `Payment marked as ${paymentStatus}` });
    } catch {
      res.status(500).json({ error: "Could not update payment status" });
    }
  });

  router.delete("/:id", requireOwnerOrAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await db.orders.findById((req.params.id as string));
      if (!existing) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      await db.orders.delete((req.params.id as string));
      io.to(`user:${existing.userId}`).emit("order:deleted", { id: (req.params.id as string) });

      res.json({ message: "Order removed successfully" });
    } catch {
      res.status(500).json({ error: "Could not delete order" });
    }
  });

  return router;
}