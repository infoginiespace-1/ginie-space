import { Router, Request, Response } from "express";
import { WhatsAppSessionManager } from "@giniespace/whatsapp-engine";

export function createWhatsAppRouter(waManager: WhatsAppSessionManager): Router {
  const router = Router();

  router.get("/status", async (req: Request, res: Response): Promise<void> => {
    try {
      const state = waManager.getSessionState(req.user!.id);
      res.json({ session: state });
    } catch {
      res.status(500).json({ error: "Could not retrieve WhatsApp connection status" });
    }
  });

  router.post("/connect", async (req: Request, res: Response): Promise<void> => {
    try {
      const state = await waManager.startSession(req.user!.id);
      res.json({ session: state, message: "WhatsApp connection initiated. Scan QR code to link." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Could not start WhatsApp connection" });
    }
  });

  router.post("/disconnect", async (req: Request, res: Response): Promise<void> => {
    try {
      await waManager.disconnectSession(req.user!.id);
      res.json({ message: "WhatsApp disconnected successfully" });
    } catch {
      res.status(500).json({ error: "Could not disconnect WhatsApp" });
    }
  });

  router.post("/send", async (req: Request, res: Response): Promise<void> => {
    try {
      const { recipientPhone, messageText } = req.body;
      if (!recipientPhone || !messageText) {
        res.status(400).json({ error: "Recipient phone number and message text are required" });
        return;
      }

      await waManager.sendMessage({
        userId: req.user!.id,
        recipientPhone: recipientPhone.trim(),
        messageText: messageText.trim(),
      });

      res.json({ message: "Message sent successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to send WhatsApp message" });
    }
  });

  return router;
}