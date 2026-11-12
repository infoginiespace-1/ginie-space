import { IDatabase } from "@giniespace/sheets-db";
import { AuthenticatedUser } from "../middleware/auth";

export const FREE_PLAN_LIMITS = {
  maxProducts: 25,
  maxLeads: 30,
  maxStaff: 1,
};

export async function getEffectivePlan(db: IDatabase, user?: AuthenticatedUser): Promise<"free" | "pro"> {
  if (!user) return "free";
  if (user.role === "admin") return "pro";
  try {
    const dbUser = await db.users.findById(user.id);
    if (dbUser?.plan === "pro") return "pro";
    if (dbUser?.plan === "free") return "free";
  } catch {}
  return user.plan === "pro" ? "pro" : "free";
}
