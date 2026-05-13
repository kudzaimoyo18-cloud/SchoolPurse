# SchoolPurse

Internal finance tracking dashboard for Zimbabwean schools. Built for school admin boards to record cash payments, track arrears, log expenses, and generate monthly P&L reports.

- **Single-purpose:** payment tracking only — no parent/student logins, no payment gateways, no public-facing features.
- **Cash-only** payments recorded manually by the bursar.
- **USD** for v1 (architecture supports adding ZWG/ZiG later).

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + React 19
- [TypeScript](https://www.typescriptlang.org/) + [Tailwind CSS 4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) primitives (base-nova preset)
- [Supabase](https://supabase.com/) (Postgres + RLS + Auth) via `@supabase/ssr`
- [TanStack Query](https://tanstack.com/query/latest) for client cache
- [Recharts](https://recharts.org/) for charts, [Lucide](https://lucide.dev/) for icons
- [react-hook-form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for forms
- Deploys to [Vercel](https://vercel.com/)

## Local development

```powershell
# 1. Install dependencies
npm install

# 2. Set up environment variables
Copy-Item .env.example .env.local
# Edit .env.local with the Supabase URL + keys

# 3. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

## Scripts

| Command         | Purpose                          |
| --------------- | -------------------------------- |
| `npm run dev`   | Start dev server (Turbopack)     |
| `npm run build` | Production build                 |
| `npm run start` | Run production build locally     |
| `npm run lint`  | ESLint                           |

## Project structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx        # Root layout with ThemeProvider + QueryProvider
│   ├── page.tsx          # Landing
│   └── globals.css       # Design tokens (light + dark + accent variants)
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── theme-provider.tsx
│   └── query-provider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts     # Browser Supabase client
│   │   ├── server.ts     # Server-component Supabase client
│   │   ├── admin.ts      # Service-role client (server-only)
│   │   └── types.ts      # Database types (placeholder)
│   └── utils.ts          # cn() helper
└── proxy.ts              # Auth session refresh (Next 16 replacement for middleware.ts)
```

## Design reference

`design-handoff/` contains the prototype and design tokens. Read `design-handoff/design_handoff_schoolpurse/README.md` before building screens.

## Phases

- ✅ **Phase 0** — Scaffolding (stack, tokens, Supabase clients)
- ⏳ **Phase 1** — Auth + dashboard shell
- ⏳ **Phase 2** — Students, fees, invoices, payments, arrears
- ⏳ **Phase 3** — Expenses, dashboard, reports
- ⏳ **Phase 4** — PDF receipts, settings, audit log polish
