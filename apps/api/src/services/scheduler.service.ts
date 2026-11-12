import { IDatabase } from "@giniespace/sheets-db";
import { WhatsAppSessionManager } from "@giniespace/whatsapp-engine";
import { NotificationService } from "./notification.service";
import { normalizePhoneDigits } from "../utils/phone";

function getIstDateAndHour(): { dateStr: string; hour: number } {
  const istNow = new Date(Date.now() + 330 * 60 * 1000);
  return {
    dateStr: istNow.toISOString().slice(0, 10),
    hour: istNow.getUTCHours(),
  };
}

export function startDailyReportScheduler(
  db: IDatabase,
  waManager: WhatsAppSessionManager,
  notificationService: NotificationService
) {
  const runTick = async () => {
    try {
      const { dateStr, hour } = getIstDateAndHour();
      const businesses = await db.businesses.findMany().catch(() => []);

      for (const biz of businesses) {
        let parsed: any = {};
        if (biz.settingsJson) {
          try {
            parsed = JSON.parse(biz.settingsJson);
          } catch {}
        }

        if (!parsed.dailySummaryEnabled) continue;
        const targetHour = Number(parsed.dailySummaryHour ?? 21);
        if (hour !== targetHour) continue;
        if (parsed.lastDailySummaryDate === dateStr) continue;

        const targetDigits = normalizePhoneDigits(biz.phone || "");
        if (!targetDigits || targetDigits.length < 10) continue;

        const [orders, products] = await Promise.all([
          db.orders.findMany({ userId: biz.userId }).catch(() => []),
          db.products.findMany({ userId: biz.userId }).catch(() => []),
        ]);

        const todayOrders = orders.filter(
          (o) => (o.createdAt || "").startsWith(dateStr) && o.status !== "cancelled"
        );
        const todayRevenue = todayOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
        const pendingOrders = orders.filter((o) => o.status === "pending").length;
        const totalPendingDue = orders
          .filter((o) => o.status !== "cancelled" && o.paymentStatus !== "paid")
          .reduce((s, o) => s + Math.max(0, (Number(o.totalAmount) || 0) - (Number(o.paidAmount) || 0)), 0);
        const lowStock = products.filter((p) => p.itemType !== "service" && Number(p.stock) <= 5);
        const tomorrowStr = new Date(Date.now() + (330 + 24 * 60) * 60 * 1000).toISOString().slice(0, 10);
        const todayBookings = orders.filter(
          (o) => o.status !== "cancelled" && String(o.bookingDate || "").trim() === dateStr
        );
        const dueRenewals = orders.filter(
          (o) => o.status !== "cancelled" && Boolean(o.nextRenewalDate) && String(o.nextRenewalDate) <= tomorrowStr
        );

        const reportMsg =
          `🌙 *GinieSpace Automated Nightly Summary (${dateStr})*\n` +
          `🏪 *${biz.name || "Your Business"}*\n\n` +
          `🛒 Today's Orders & Bookings: *${todayOrders.length}* (₹${todayRevenue.toLocaleString("en-IN")})\n` +
          (todayBookings.length > 0 ? `🗓️ Today's Scheduled Visits: *${todayBookings.length}*\n` : "") +
          `⏳ Pending Queue: *${pendingOrders}*\n` +
          `📒 Total Udhar/Due: *₹${totalPendingDue.toLocaleString("en-IN")}*\n` +
          (dueRenewals.length > 0
            ? `🔔 Renewals Due (${dateStr} / Tomorrow): *${dueRenewals.length}*\n` +
              dueRenewals.slice(0, 3).map((r) => `  • ${r.customerName} (${r.nextRenewalDate})`).join("\n") +
              "\n"
            : "") +
          `⚠️ Low Stock Items: *${lowStock.length}*` +
          (lowStock.length > 0 ? `\n${lowStock.slice(0, 5).map((p) => `  • ${p.name} (${p.stock})`).join("\n")}` : "");

        let sent = false;
        if (waManager.getSessionState(biz.userId).status === "connected") {
          try {
            await waManager.sendMessage({ userId: biz.userId, recipientPhone: targetDigits, messageText: reportMsg });
            sent = true;
          } catch {}
        }
        if (!sent) {
          sent = await notificationService.sendSupportNotification(targetDigits, reportMsg);
        }

        if (sent) {
          parsed.lastDailySummaryDate = dateStr;
          await db.businesses.update(biz.id, { settingsJson: JSON.stringify(parsed) }).catch(() => {});
        }
      }
    } catch (err: any) {
      console.warn("[DailyScheduler] Tick warning:", err?.message);
    }
  };

  // Check every 15 minutes
  setInterval(runTick, 15 * 60 * 1000);
}
