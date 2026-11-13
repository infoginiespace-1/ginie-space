import { IDatabase } from "@giniespace/sheets-db";
import { AuthenticatedUser } from "../middleware/auth";

export const FREE_PLAN_LIMITS = {
  maxProducts: 15,
  maxLeads: 10,
  maxStaff: 1,
  allowBulkBroadcast: false,
  allowDailySummary: false,
};

export const PRO_PLAN_LIMITS = {
  maxProducts: 10000,
  maxLeads: 10000,
  maxStaff: 5,
  allowBulkBroadcast: true,
  allowDailySummary: true,
};

export const PRO_PRICING = {
  monthly: 99,
  yearly: 999,
  currency: "INR",
  upiId: "9279259690@fam", // Official UPI ID for instant approval
  supportPhone: "919279259690",
};

export async function getEffectivePlan(db: IDatabase, user?: AuthenticatedUser): Promise<"free" | "pro"> {
  if (!user) return "free";
  if (user.role === "admin") return "pro";

  try {
    const dbUser = await db.users.findById(user.id);
    if (!dbUser) return user.plan === "pro" ? "pro" : "free";

    // Check subscription expiration if plan is pro
    if (dbUser.plan === "pro") {
      if (dbUser.planExpiresAt) {
        const expiryTime = new Date(dbUser.planExpiresAt).getTime();
        if (Number.isFinite(expiryTime) && expiryTime < Date.now()) {
          // Subscription expired, downgrade to free
          await db.users.update(dbUser.id, {
            plan: "free",
            subscriptionStatus: "expired",
          }).catch(() => {});
          return "free";
        }
      }
      return "pro";
    }

    if (dbUser.plan === "free") return "free";
  } catch {}

  return user.plan === "pro" ? "pro" : "free";
}
