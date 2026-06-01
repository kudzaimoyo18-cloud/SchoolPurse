# SchoolPurse

Multi-tenant finance SaaS for Zimbabwean schools. Bursars and school staff record cash payments, manage students and invoices, issue receipts, track arrears, log expenses, and (eventually) generate monthly P&L reports.

- **Multi-tenant:** schools-as-tenants, RLS-scoped data. Staff-only access via invite; no parent/student logins.
- **Cash-only** payments recorded manually by the bursar. No payment gateways.
- **USD** for v1 (architecture supports adding ZWG/ZiG later).
- Public marketing site at `/`; the app itself lives under `/app/*` behind auth.

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
├── app/
│   ├── (marketing)/                 # Public landing + contact form
│   ├── api/                         # API routes
│   ├── auth/, login/, onboarding/   # Account lifecycle
│   └── app/                         # Authed app (RLS-scoped by school)
│       ├── (dashboard)/
│       ├── invoices/
│       └── receipts/
├── components/
│   └── ui/                          # shadcn/ui primitives (base-nova preset)
├── lib/
│   ├── supabase/                    # client.ts | server.ts | admin.ts (service-role, server-only)
│   ├── auth/, queries/
│   ├── csv.ts                       # bulk import/export
│   ├── format.ts                    # money/date formatting
│   ├── resend.ts                    # transactional + announcement emails
│   ├── security.ts
│   └── storage.ts                   # Supabase Storage (school logos, student photos)
└── proxy.ts                         # Auth session refresh (Next 16 replacement for middleware.ts)
```

## Design reference

`design-handoff/` contains the prototype and design tokens. Read `design-handoff/design_handoff_schoolpurse/README.md` before building screens.

## Status

Active, approaching ship. Run `git log --oneline -1` for the current head — the surface below is inferred from commits and migrations, not hand-curated, so refresh it when phases close.

### Shipped

- Auth, team invites, welcome email on invite + auto-activate on first login
- Multi-tenant schools: logos, settings, uniforms, school levels, class levels
- Students: registration, carry-over mode for prior records, student photos
- Invoices: lines with `paid_usd` sync, "Create Invoice" topbar shortcut
- Payments: recording, inline add-new-student in payment form, payment notes
- Receipts: issuing, voiding from the table action column
- Announcements: platform-wide banner + per-user dismissal + Resend email
- Marketing site: landing with Zimbabwean flag + school photos section
- Design system: navy-blue palette, shadcn sidebar block, aurora bg, glass button, gooey toggle (Tailwind v4 paren syntax)
- Pre-ship hardening: 4 Supabase security-advisor findings fixed; migrated to `sb_secret_*` keys with legacy fallback

### Outstanding

- PDF receipt export
- Expense tracking + monthly P&L
- Audit log polish
- ZWG / multi-currency
- **No tests yet** — Vitest + RTL setup is the next big chore (financial domain + no tests = single largest risk)
