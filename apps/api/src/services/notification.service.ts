import { WhatsAppSessionManager } from "@giniespace/whatsapp-engine";
import { IDatabase } from "@giniespace/sheets-db";

export const SYSTEM_SUPPORT_SESSION_ID = "system-support";
export const SYSTEM_SUPPORT_PHONE = "919279259690";

export class NotificationService {
  constructor(
    private waManager: WhatsAppSessionManager,
    private db: IDatabase
  ) {}

  async sendSupportNotification(recipientPhone: string, messageText: string): Promise<boolean> {
    try {
      const state = this.waManager.getSessionState(SYSTEM_SUPPORT_SESSION_ID);
      if (state.status !== "connected") {
        console.warn("[NotificationService] Support WhatsApp (9279259690) is not connected. Alert skipped.");
        return false;
      }
      await this.waManager.sendMessage({
        userId: SYSTEM_SUPPORT_SESSION_ID,
        recipientPhone,
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
    const msg = `🎉 *Welcome to GinieSpace, ${userName}!* \n\nAapka smart retail & wholesale workspace successfully active ho gaya hai.\n\n📌 *Official Support Helpline:* +91 9279259690\n🌐 *Dashboard Portal:* https://app.ginie.space\n\nKisi bhi sahayata ke liye aap is number par WhatsApp message bhej sakte hain.`;
    return this.sendSupportNotification(userPhone, msg);
  }

  async notifyOrderPlaced(order: any, customerPhone: string): Promise<boolean> {
    if (!customerPhone) return false;
    const msg = `📦 *GinieSpace Order Alert*\n\nNamaste ${order.customerName},\nAapka order #${order.id.slice(-6)} confirm ho gaya hai.\n💰 *Total Amount:* ₹${order.totalAmount}\n\nKisi bhi sahayata ke liye GinieSpace Support (+91 9279259690) par sampark karein.`;
    return this.sendSupportNotification(customerPhone, msg);
  }

  async notifyLeadConverted(merchantName: string, leadName: string, merchantPhone: string): Promise<boolean> {
    if (!merchantPhone) return false;
    const msg = `🎯 *Lead Converted!*\n\nNamaste ${merchantName},\nAapka lead "${leadName}" successfully Customer me convert ho gaya hai. Aap unhe direct WhatsApp message bhej sakte hain.\n\n- GinieSpace Retail Hub`;
    return this.sendSupportNotification(merchantPhone, msg);
  }
}
