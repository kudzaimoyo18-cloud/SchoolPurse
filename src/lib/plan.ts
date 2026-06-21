// Plan tiers + limits for the freemium model. Pure + framework-free so it can
// be unit-tested and shared by every gate. Server-side lookups live in
// plan-server.ts.

// Internal plan keys. NOTE: the `free` key is the paid **Starter** tier
// ($35/mo, 50 students) — there is no $0 plan. The key is kept to avoid a
// DB/Whop migration; the name shown everywhere is "Starter".
export type Plan = "free" | "pro" | "ai";

export const PLAN_LABEL: Record<Plan, string> = {
  free: "Starter",
  pro: "Pro",
  ai: "AI",
};

export const PLAN_LIMITS: Record<
  Plan,
  { maxStudents: number; maxUsers: number }
> = {
  free: { maxStudents: 50, maxUsers: 1 }, // Starter — $35/mo
  pro: { maxStudents: 250, maxUsers: Number.POSITIVE_INFINITY }, // $50/mo
  ai: {
    maxStudents: Number.POSITIVE_INFINITY, // custom pricing
    maxUsers: Number.POSITIVE_INFINITY,
  },
};

/** Coerce an unknown DB value to a valid Plan, defaulting to the entry tier. */
export function normalizePlan(value: unknown): Plan {
  return value === "pro" || value === "ai" ? value : "free";
}

/** True if adding `adding` more students would exceed the plan's student cap. */
export function exceedsStudentLimit(
  plan: Plan,
  activeCount: number,
  adding = 1,
): boolean {
  return activeCount + adding > PLAN_LIMITS[plan].maxStudents;
}

/** True if adding `adding` more users would exceed the plan's user cap. */
export function exceedsUserLimit(
  plan: Plan,
  userCount: number,
  adding = 1,
): boolean {
  return userCount + adding > PLAN_LIMITS[plan].maxUsers;
}

export function studentLimitMessage(plan: Plan): string {
  const cap = PLAN_LIMITS[plan].maxStudents;
  const nextTier = plan === "pro" ? "AI" : "Pro";
  return `Your ${PLAN_LABEL[plan]} plan is limited to ${cap} students. Upgrade to ${nextTier} for more.`;
}

export function userLimitMessage(plan: Plan): string {
  return `Your ${PLAN_LABEL[plan]} plan includes a single user. Upgrade to Pro to add teammates.`;
}
