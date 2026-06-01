import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vitest config for SchoolPurse — follows the official Next.js 16 testing guide
// (node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md).
//
// Note: async Server Components are not supported by Vitest. Test pure helpers
// and synchronous (client) components here. Async server-rendered pages should
// be covered by Playwright E2E instead.
//
// `resolve.tsconfigPaths: true` replaces the previously recommended
// `vite-tsconfig-paths` plugin — Vite now resolves tsconfig `paths` natively.
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    // Keep Playwright's e2e/*.spec.ts files out of the Vitest pool. They use
    // a different test runtime and would fail under jsdom. Use proper globs:
    // bare "node_modules" is treated as a literal filename, not a directory.
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/e2e/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/app/**/layout.tsx",
        "src/app/**/page.tsx",
        "src/proxy.ts",
      ],
    },
  },
});
