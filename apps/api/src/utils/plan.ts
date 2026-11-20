import { IDatabase } from "@giniespace/sheets-db";
import { AuthenticatedUser } from "../middleware/auth";

export const FREE_PLAN_LIMITS = {
  maxProducts: 100000, // Unlimited products for all merchants
  maxLeads: 100000,    // Unlimited leads
  maxDailyLeadSearches: 100, // Generous free search quota
  maxStaff: 20,        // Multi-staff unlocked for everyone
  allowBulkBroadcast: true,
  allowDailySummary: true,
};

export const PRO_PLAN_LIMITS = {
  maxProducts: 100000,
  maxLeads: 100000,
  maxMonthlyLeadSearches: 1000,
  maxStaff: 20,
  allowBulkBroadcast: true,
  allowDailySummary: true,
};

export const PRO_PRICING = {
  monthly: 0, // 100% Free Forever
  yearly: 0,
  currency: "INR",
  supportPhone: "919279259690",
};

export async function getEffectivePlan(db: IDatabase, user?: AuthenticatedUser): Promise<"free" | "pro"> {
  // All merchants have full, unlimited access forever
  return "free";
}
