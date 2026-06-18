// Plan tiers + limits for the freemium model. Pure + framework-free so it can
// be unit-tested and shared by every gate. Server-side lookups live in
// plan-server.ts.

export type Plan = "free" | "pro" | "ai";

export const PLAN_LIMITS: Record<
  Plan,
  { maxStudents: number; maxUsers: number }
> = {
  free: { maxStudents: 100, maxUsers: 1 },
  pro: {
    maxStudents: Number.POSITIVE_INFINITY,
    maxUsers: Number.POSITIVE_INFINITY,
  },
  ai: {
    maxStudents: Number.POSITIVE_INFINITY,
    maxUsers: Number.POSITIVE_INFINITY,
  },
};

/** Coerce an unknown DB value to a valid Plan, defaulting to the free tier. */
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
  return `Your ${plan} plan is limited to ${PLAN_LIMITS[plan].maxStudents} students. Upgrade to Pro for unlimited students.`;
}

export function userLimitMessage(plan: Plan): string {
  return `Your ${plan} plan includes a single user. Upgrade to Pro to add teammates.`;
}
