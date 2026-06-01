import { defineConfig, devices } from "@playwright/test";

// Playwright config for SchoolPurse — smoke E2E only at this stage.
//
// Auth uses Google OAuth, so flows past the login page need either
// stored authState (run a one-time login by hand and save storage state)
// or a Supabase test project with email/password enabled. Until then,
// the suite focuses on public surface area + protected-route redirects.
//
// The web server uses `npm run dev` so the local .env.local applies.
// Switch to `npm run build && npm run start` once perf flakiness shows up.

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
