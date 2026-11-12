import { WhatsAppSessionManager } from "@giniespace/whatsapp-engine";
import { IDatabase } from "@giniespace/sheets-db";
import { normalizePhoneDigits } from "../utils/phone";

export const SYSTEM_SUPPORT_SESSION_ID = "system-support";
export const SYSTEM_SUPPORT_PHONE = "919279259690";

export interface NotificationRules {
  newUserWelcome: boolean;
  orderPlacedAlert: boolean;
  leadConvertedAlert: boolean;
  supportAutoReply: boolean;
}

const DEFAULT_RULES: NotificationRules = {
  newUserWelcome: true,
  orderPlacedAlert: true,
  leadConvertedAlert: true,
  supportAutoReply: true,
};

export class NotificationService {
  private lastAutoReplyMap: Map<string, number> = new Map();

  constructor(
    private waManager: WhatsAppSessionManager,
    private db: IDatabase
  ) {}

  async getRules(): Promise<NotificationRules> {
    try {
      const setting = await this.db.settings.findOne({ userId: "admin", key: "notification_rules" });
      if (setting?.value) {
        return { ...DEFAULT_RULES, ...JSON.parse(setting.value) };
      }
    } catch {}
    return DEFAULT_RULES;
  }

  async sendSupportNotification(recipientPhone: string, messageText: string): Promise<boolean> {
    try {
      const state = this.waManager.getSessionState(SYSTEM_SUPPORT_SESSION_ID);
      if (state.status !== "connected") {
        console.warn("[NotificationService] Support WhatsApp (9279259690) is not connected. Alert skipped.");
        return false;
      }
      const digits = normalizePhoneDigits(recipientPhone);
      if (!digits || digits.length < 10) return false;

      await this.waManager.sendMessage({
        userId: SYSTEM_SUPPORT_SESSION_ID,
        recipientPhone: digits,
        messageText,
      });
      return true;
    } catch (err: any) {
      console.error("[NotificationService] Failed to send support alert:", err.message);
      return false;
    }
  }

  async notifyNewUserOnboarding(userName: string, userPhone: string): Promise<boolean> {
    if (!userPhone) return false;
    const rules = await this.getRules();
    if (!rules.newUserWelcome) return false;

    const msg = `🎉 *Welcome to GinieSpace, ${userName}!* \n\nAapka smart retail & wholesale workspace successfully active ho gaya hai.\n\n📌 *Official Support Helpline:* +91 9279259690\n🌐 *Dashboard Portal:* https://app.ginie.space\n\nKisi bhi sahayata ke liye aap is number par WhatsApp message bhej sakte hain.`;
    return this.sendSupportNotification(userPhone, msg);
  }

  async notifyOrderPlaced(order: any, customerPhone: string): Promise<boolean> {
    if (!customerPhone) return false;
    const rules = await this.getRules();
    if (!rules.orderPlacedAlert) return false;

    const msg = `📦 *GinieSpace Order Alert*\n\nNamaste ${order.customerName},\nAapka order #${order.id.slice(-6)} confirm ho gaya hai.\n💰 *Total Amount:* ₹${order.totalAmount}\n\nKisi bhi sahayata ke liye GinieSpace Support (+91 9279259690) par sampark karein.`;
    return this.sendSupportNotification(customerPhone, msg);
  }

  async notifyLeadConverted(merchantName: string, leadName: string, merchantPhone: string): Promise<boolean> {
    if (!merchantPhone) return false;
    const rules = await this.getRules();
    if (!rules.leadConvertedAlert) return false;

    const msg = `🎯 *Lead Converted!*\n\nNamaste ${merchantName},\nAapka lead "${leadName}" successfully Customer me convert ho gaya hai. Aap unhe direct WhatsApp message bhej sakte hain.\n\n- GinieSpace Retail Hub`;
    return this.sendSupportNotification(merchantPhone, msg);
  }

  async handleSupportIncomingMessage(senderJid: string, senderName: string | undefined, text: string): Promise<void> {
    // Ignore groups and status broadcasts
    if (!senderJid || senderJid.endsWith("@g.us") || senderJid === "status@broadcast") return;

    const rules = await this.getRules();
    if (!rules.supportAutoReply) return;

    const digits = normalizePhoneDigits(senderJid);
    if (!digits || digits === SYSTEM_SUPPORT_PHONE) return;

    // Rate-limit auto-reply to max once every 6 hours per number to prevent bot loops
    const now = Date.now();
    const lastSent = this.lastAutoReplyMap.get(digits) || 0;
    if (now - lastSent < 6 * 60 * 60 * 1000) return;

    this.lastAutoReplyMap.set(digits, now);

    const greetingName = senderName ? ` ${senderName}` : "";
    const reply = `Namaste${greetingName}! 🙏\n\n*GinieSpace Official Support (+91 9279259690)* me aapka swagat hai.\n\nHum aapki kis prakar madad kar sakte hain?\n1️⃣ Account Setup / Login Help\n2️⃣ WhatsApp QR Linking Guide\n3️⃣ Orders & Billing Support\n\n🌐 Portal: https://app.ginie.space\nHamari team jald hi aapki query par reply karegi.`;

    await this.sendSupportNotification(digits, reply);
  }
}
