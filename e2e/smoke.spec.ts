import { expect, test } from "@playwright/test";

// Smoke E2E — verifies the most critical "the site is up" contracts without
// authenticated access. Login requires Google OAuth and is exercised via a
// separate authState flow (TODO: add `auth.setup.ts` once a test Google
// account or Supabase password auth is available).

test.describe("Public surface", () => {
  test("marketing site loads at /", async ({ page }) => {
    await page.goto("/");
    // The marketing landing page must render something meaningful (not a
    // 5xx, not a blank shell). A visible heading is the minimum contract.
    await expect(page).toHaveTitle(/SchoolPurse/i);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("login page renders the sign-in card", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Sign in/i);
    // The page promises Google OAuth — the affordance text must be present.
    await expect(page.getByText(/sign in with google/i)).toBeVisible();
    // The card itself should render the SchoolPurse wordmark.
    await expect(page.getByRole("heading", { name: /SchoolPurse/ })).toBeVisible();
  });
});

test.describe("Auth protection", () => {
  test("unauthenticated request to /app/overview redirects away", async ({
    page,
  }) => {
    // Hitting a protected route without a session must NOT land on the
    // dashboard. The contract here is "redirected somewhere safe" (login,
    // home, or onboarding) — not "200 on /app/overview".
    const response = await page.goto("/app/overview");
    expect(response).toBeTruthy();
    await expect(page).not.toHaveURL(/\/app\/overview\b/);
    // And the URL we land on should be a public surface — login, root,
    // or onboarding entry — not a 500 page.
    await expect(page).toHaveURL(/\/(login|onboarding|$)/);
  });
});
