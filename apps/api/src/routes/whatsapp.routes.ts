import { Router, Request, Response } from "express";
import { WhatsAppSessionManager } from "@giniespace/whatsapp-engine";
import { IDatabase } from "@giniespace/sheets-db";
import { normalizePhoneDigits } from "../utils/phone";

export function createWhatsAppRouter(
  waManager: WhatsAppSessionManager,
  db: IDatabase
): Router {
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

  router.get("/messages", async (req: Request, res: Response): Promise<void> => {
    try {
      const all = await db.messages.findMany({ userId: req.user!.id });
      all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      res.json({ messages: all });
    } catch {
      res.status(500).json({ error: "Could not load chat history" });
    }
  });

  router.post("/send", async (req: Request, res: Response): Promise<void> => {
    try {
      const { recipientPhone, messageText, contactName, mediaDataUrl } = req.body;
      if (!recipientPhone || (!messageText && !mediaDataUrl)) {
        res.status(400).json({ error: "Recipient phone number and message text or media are required" });
        return;
      }

      const sentInfo = await waManager.sendMessage({
        userId: req.user!.id,
        recipientPhone: recipientPhone.trim(),
        messageText: (messageText || "").trim(),
        mediaDataUrl: typeof mediaDataUrl === "string" ? mediaDataUrl.trim() : undefined,
        antiBan: {
          simulateTyping: true,
          randomizeHash: true,
        },
      });

      const now = new Date().toISOString();
      const contactDigits = normalizePhoneDigits(recipientPhone);

      const saved = await db.messages.create({
        userId: req.user!.id,
        contactPhone: contactDigits,
        contactName: contactName ? String(contactName).trim() : "",
        text: mediaDataUrl ? `[Photo] ${(messageText || "").trim()}` : (messageText || "").trim(),
        fromMe: "true",
        messageId: sentInfo?.key?.id || Date.now().toString(),
        timestamp: now,
      }).catch(() => null);

      res.json({ message: "Message sent successfully", saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to send WhatsApp message" });
    }
  });

  return router;
}
