import { Router, Request, Response } from "express";
import { IDatabase, OrderStatus } from "@giniespace/sheets-db";
import { Server } from "socket.io";
import { WhatsAppSessionManager } from "@giniespace/whatsapp-engine";
import { NotificationService } from "../services/notification.service";
import { toE164 } from "../utils/phone";

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
      const { customerId, customerName, customerPhone, items, totalAmount, notes } = req.body;

      if (!customerName || !customerPhone || totalAmount === undefined) {
        res.status(400).json({ error: "Customer name, phone number, and total amount are required" });
        return;
      }

      const order = await db.orders.create({
        userId: req.user!.id,
        customerId: customerId || "",
        customerName: customerName.trim(),
        customerPhone: toE164(customerPhone) || customerPhone.trim(),
        itemsJson: typeof items === "string" ? items : JSON.stringify(items || []),
        totalAmount: Number(totalAmount) || 0,
        status: "pending",
        notes: notes ? notes.trim() : undefined,
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

  router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
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