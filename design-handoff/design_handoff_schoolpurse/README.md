# Handoff: SchoolPurse Dashboard

## Overview
SchoolPurse is a school accounting and fee-tracking dashboard. It helps school bursars and administrators:
- Track fee payments and issue instant receipts
- Identify students in arrears (with days overdue)
- Log and categorise expenses
- View monthly P&L and income vs. expenses trends
- Configure school info, fee structure, and notification settings

This handoff covers a **6-screen single-page dashboard application** built as a React-based admin panel.

---

## About the Design Files
The HTML file in this bundle (`SchoolPurse Dashboard.html`) is a **design reference prototype** built with inline React + Babel. It is **not** production code to ship as-is. Your job is to **recreate this design inside the target codebase's environment** — using its established framework (React, Vue, Svelte, etc.), routing, state management, API client, and component library.

If no codebase exists yet, choose the most appropriate modern stack for an admin dashboard. Recommended:
- **Frontend:** React + TypeScript + Vite, or Next.js
- **Styling:** Tailwind CSS or CSS Modules (the design uses inline styles for prototyping only)
- **Charts:** Recharts, Visx, or keep the hand-rolled SVG approach for full control
- **Backend:** Node/Express, Laravel, or Django REST — schools often need on-premise deploys, so consider PostgreSQL + simple server stack
- **Auth:** Session-based or JWT, with role-based access (Admin, Bursar, Viewer)

---

## Fidelity
**High-fidelity (hifi).** Pixel-perfect mockups with final colors, typography, spacing, icons, layout, and interaction states. The dev should recreate the UI to match the prototype, then wire it to the real backend API.

---

## Brand & Design Tokens

### Color Palette

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--accent` | `#22c27a` | `#22c27a` | Brand green, primary CTAs, links, positive amounts |
| `--accent-soft` | `#22c27a18` | `#22c27a28` | Accent backgrounds (badges, tags) |
| `--sidebar` | `#0b1f2e` | `#0b1f2e` | Sidebar — always dark navy, both modes |
| `--bg` | `#f0f3f7` | `#0f1923` | Page background |
| `--card` | `#ffffff` | `#172535` | Card background |
| `--card-alt` | `#f8fafc` | `#1e3045` | Table header rows |
| `--border` | `#e2e8f2` | `#243650` | Card borders, dividers |
| `--border-strong` | `#d1d9e6` | `#2e4560` | Stronger borders when needed |
| `--text` | `#14263a` | `#dce8f5` | Primary text |
| `--text-sub` | `#52697e` | `#8aa4be` | Secondary text |
| `--muted` | `#94a8bc` | `#5e7a94` | Tertiary/icon/placeholder |
| `--red` | `#ef4444` | `#ef4444` | Critical arrears, expenses, errors |
| `--red-soft` | `#fff2f2` | `#3d1515` | Critical badge background |
| `--amber` | `#f59e0b` | `#f59e0b` | Moderate arrears warning |
| `--amber-soft` | `#fffbeb` | `#3a2500` | Moderate badge background |
| `--green` | `#22c55e` | `#22c55e` | Trend up indicators |
| `--green-soft` | `#f0fdf4` | `#0b2d18` | Light arrears badge bg |

### Alternate accent options (Tweaks Panel)
- SchoolPurse Green: `#22c27a` (default)
- SchoolPurse Blue: `#3b82f6`
- Warm Amber: `#f59e0b`

### Typography
- **Font family:** `DM Sans` (Google Fonts), weights 300/400/500/600/700
- **Scale:**
  - Page title: 17px / 700
  - Section title: 14.5px / 600
  - KPI value: 26px / 700, letter-spacing -0.02em
  - Body: 13px / 400-500
  - Table cell: 13px / 500
  - Small/muted: 11.5–12px / 400
  - Label/eyebrow: 10.5px / 600, uppercase, letter-spacing 0.07em–0.09em

### Spacing
- Card padding: 20–24px
- Grid gap: 14px (KPI rows), 22px (between section rows)
- Table cell padding: 11–12px vertical / 16px horizontal
- Border radius: 6px (badges), 7–8px (inputs/buttons), 9–12px (cards)

### Shadows
- The design is **mostly flat** — borders do the visual separation, not shadows.
- Tweaks panel uses: `0 12px 40px rgba(0,0,0,0.5)`

### Iconography
The design uses a small set of inline SVG icons (1.7–2px stroke, no fill, rounded line caps): `home`, `card`, `warn`, `file`, `bar`, `gear`, `moon`, `sun`, `plus`, `search`, `up`, `down`, `bell`, `check`, `dl` (download), `send`, `x`. Match using **Lucide React** or **Feather Icons** — both have all of these.

---

## Layout Structure

```
┌────────────┬──────────────────────────────────────────────┐
│            │  TopBar (page title + Quick Payment + bell)  │
│  Sidebar   ├──────────────────────────────────────────────┤
│  (218px,   │                                              │
│   dark     │  Main content (scrollable)                   │
│   navy,    │  padding: 24px 28px 40px                     │
│   fixed)   │                                              │
│            │                                              │
└────────────┴──────────────────────────────────────────────┘
```

### Sidebar (`width: 218px`, always dark `#0b1f2e`)
- **Logo block** — Brand mark (briefcase-with-dot SVG) + "School**Purse**" wordmark (green "Purse"); subtitle: school name + term/year
- **Nav items** — icon (16px) + label, active state has accent-tinted background + accent icon color, white label
- **Arrears item** carries a **red pill badge** with the count (e.g. `12`)
- **Bottom:** Light/Dark toggle, then user avatar block (initials in accent circle + name + role)

### Top Bar (`padding: 13px 26px`, white/dark card bg)
- Left: page title (17px/700) + date subtitle (11.5px/muted)
- Right: "**+ Quick Payment**" primary button + bell icon button with red dot if notifications

---

## Screens

### 1. Overview (`/`)
**Purpose:** At-a-glance financial health of the school.

**Components, top to bottom:**
1. **KPI Cards row** — 4 cards in a 4-column grid:
   - Today's Collections (with trend % up)
   - April Income (with trend %)
   - Outstanding (red value if alarming — `n students in arrears`)
   - Net (April) — Income − Expenses
   - Each card has a 3px accent stripe on the left edge.
2. **Charts row** — Two cards side by side (1fr / 320px):
   - **Income vs Expenses** bar chart (6 months, grouped bars: accent for income, muted for expenses, with $k labels above each income bar)
   - **Expense Breakdown** — full pie chart (180px) with total amount + label centered **below** the chart, then category legend with per-row mini-bar showing %
3. **Fee Collection Rate card** — Full-width single-line progress bar (term target, collected, outstanding labels below)
4. **Bottom row** — Two cards (1fr / 340px):
   - **Students in Arrears** table — top 5 rows, "View all 12 →" CTA in header
   - **Recent Payments** — vertical list of 6 most-recent payments (name, class, receipt # → date, +amount in accent)

### 2. Payments (`/payments`)
**Purpose:** Record cash/transfer/mobile payments at the office and issue receipts.

- Subtitle + "**+ Record Payment**" button (right-aligned)
- 3 KPI cards: April Total, Today, Avg Payment
- **Expandable "New Payment" form** (toggles on click) — 2-row grid:
  - Row 1: Student Name (autocomplete), Amount, Date
  - Row 2: Payment Method (select), Fee Type (select), Notes
  - Submit shows brief "**✓ Saved! Receipt Issued**" success state
- **Payments table:** Receipt # · Student · Class · Amount · Method · Date · Action (download receipt)
- Search bar + Export button in table header

### 3. Arrears (`/arrears`)
**Purpose:** Identify and act on students with outstanding fees.

- 4 KPI cards: Total Outstanding, Critical (>60d), Moderate (30–60d), Avg Days Overdue
- **Class breakdown grid** — One small card per form with students in arrears (Form 1, Form 2, etc.), showing total owed + count + a collection progress bar
- **Arrears table** — Student · Class · Term Fee · Paid · Balance · Status · Action ("Record Payment" pill button)
- **Status badge** colors:
  - Green: ≤ 30 days
  - Amber: 31–60 days
  - Red: > 60 days
- Live search by name or class
- Header actions: "Send Reminders", "Export CSV"

### 4. Expenses (`/expenses`)
**Purpose:** Track and categorise school expenditure.

- 3 KPI cards: Total Expenses (Apr), Largest Category, vs Last Month
- Expandable "**Add Expense**" form (4-col grid: Date, Description, Amount, Category)
- 2-column layout: transactions table (left) + Expense Breakdown donut card (right)
- Expense categories with assigned colors:
  - Payroll `#6366f1`
  - Utilities `#f59e0b`
  - Maintenance `#ef4444`
  - Supplies `#8b5cf6`
  - Operations `#06b6d4`

### 5. Reports & P&L (`/reports`)
**Purpose:** Monthly profit & loss analysis.

- 4 KPI cards: YTD Income, YTD Expenses, Net Surplus, Avg Net Margin
- **Income vs Expenses** bar chart (full-width)
- **Monthly P&L summary table:** Month · Income · Expenses · Net · Margin (with inline progress bar)
- Export CSV button

### 6. Settings (`/settings`)
**Purpose:** Configure school information, fee structure, and notifications.

- **School Information** card — 6 inputs in 2-col grid (Name, Reg #, Address, Phone, Email, Academic Year)
- **Fee Structure (USD)** card — 6 inputs in 2-col grid (Form 1–3, 4–5, 6 Term Fees, Development Levy, Exam Fee, Sports Levy)
- **Notifications & Integrations** card — 4 toggleable settings:
  - Send WhatsApp receipt immediately after payment
  - Email receipt to parent/guardian
  - Alert bursar when student is 30+ days overdue
  - Weekly P&L summary report via email
- Each card has a "Save Changes" button

---

## Interactions & Behavior

### Sidebar Nav
- Active route uses `accent + '25'` (transparent) bg + accent icon color
- Hover (suggest): subtle white 5% bg
- Light/Dark toggle persists in localStorage as `schoolpurse.theme`
- Arrears badge auto-updates from `GET /api/students/arrears` count

### Quick Payment (TopBar)
- Clicking jumps to `/payments` AND auto-expands the New Payment form

### Forms
- All inputs use the same style: `bg: t.bg, border: 1px solid t.border, radius: 7px, padding: 9px 12px, font: 13px DM Sans`
- Validation: Required-field highlight in red, inline error below the field
- Save buttons show a momentary success state with the check icon (2s, then hide form)

### Tables
- Row hover: `bg: t.cardAlt`
- Click on a name/row → open a side-drawer with full student/transaction detail (extension, not in current mock)
- Pagination: 25 rows per page (extension)
- Sort by column (extension)

### Status Badges (Arrears)
```js
days > 60 → red ('critical')
days > 30 → amber ('moderate')
days ≤ 30 → green ('recent')
```

### Theme Switching
- The sidebar is **always** dark navy regardless of theme.
- Only the content/cards/text switch.
- Smooth transition: `transition: background 0.2s, color 0.2s` on bg/card/text elements.

### Animations
- Toggles: 0.2s slide
- Tweaks panel: fade + 200ms ease-out
- Bar chart load: stagger bars 50ms each (extension)

---

## State Management

Suggested state shape (use Zustand, Redux Toolkit, or React Query):

```ts
interface AppState {
  user: { id, name, role: 'admin' | 'bursar' | 'viewer', schoolId }
  theme: 'light' | 'dark'
  accent: '#22c27a' | '#3b82f6' | '#f59e0b'

  // Data slices — load via React Query
  payments: Payment[]
  arrears: ArrearsStudent[]
  expenses: Expense[]
  monthlyPL: MonthlyPL[]
  schoolSettings: SchoolSettings
}
```

---

## API Contract

All endpoints are namespaced under `/api/v1`. Auth: `Authorization: Bearer <jwt>`.

### Endpoints

| Method | Path | Purpose | Returns |
|---|---|---|---|
| `GET` | `/dashboard/overview` | Bundled KPIs for Overview screen | `{ todayTotal, monthIncome, outstanding, monthNet, trends: {...} }` |
| `GET` | `/payments?limit=10&page=1` | Paginated payments list | `{ data: Payment[], total, page }` |
| `POST` | `/payments` | Record new payment, issue receipt | `Payment & { receiptUrl }` |
| `GET` | `/payments/:id/receipt.pdf` | Download single receipt | PDF blob |
| `GET` | `/students/arrears` | All students with outstanding balance | `ArrearsStudent[]` |
| `POST` | `/students/arrears/remind` | Send batch WhatsApp/email reminders | `{ sent: number }` |
| `GET` | `/expenses?from=&to=` | Expense transactions | `Expense[]` |
| `POST` | `/expenses` | Create new expense | `Expense` |
| `GET` | `/reports/monthly?year=2026` | Monthly P&L for charts | `MonthlyPL[]` |
| `GET` | `/reports/monthly.csv` | Export CSV | CSV blob |
| `GET` | `/school/settings` | School info + fee structure + notifications | `SchoolSettings` |
| `PATCH` | `/school/settings` | Update settings | `SchoolSettings` |

### Data Models

```ts
interface Payment {
  id: string
  date: string         // ISO YYYY-MM-DD
  studentId: string
  studentName: string
  class: string        // e.g. "Form 2B"
  amount: number       // USD
  receipt: string      // e.g. "SP-2874"
  method: 'Cash' | 'Bank Transfer' | 'Mobile Money'
  feeType: 'Term Fees' | 'Examination Fee' | 'Development Levy' | 'Other'
  notes?: string
}

interface ArrearsStudent {
  id: string
  name: string
  class: string
  fee: number          // total term fee
  paid: number
  daysOverdue: number  // since fee due date
}

interface Expense {
  id: string
  date: string
  description: string
  category: 'Payroll' | 'Utilities' | 'Maintenance' | 'Supplies' | 'Operations' | 'Other'
  amount: number
}

interface MonthlyPL {
  month: string        // 'Apr'
  year: number
  income: number
  expenses: number
}

interface SchoolSettings {
  name: string
  registrationNumber: string
  address: string
  phone: string
  email: string
  academicYear: number
  fees: {
    form13: number
    form45: number
    form6: number
    developmentLevy: number
    examFee: number
    sportsLevy: number
  }
  notifications: {
    whatsappReceipt: boolean
    emailReceipt: boolean
    alertOverdue: boolean
    weeklySummary: boolean
  }
}
```

---

## Auth & Roles
- **Admin** — full access including settings, fee structure changes
- **Bursar** — record payments, view arrears, manage expenses, view reports (no settings edit)
- **Viewer** — read-only dashboard access (head teacher, board members)

---

## Database Schema Suggestion (PostgreSQL)
```sql
schools(id, name, reg_no, address, phone, email, academic_year, settings_json)
users(id, school_id, name, email, role, password_hash)
students(id, school_id, name, class, parent_phone, parent_email, enrollment_date)
fees(id, school_id, student_id, term, year, amount, due_date)
payments(id, school_id, student_id, fee_id, amount, method, receipt_no, fee_type, notes, recorded_by, created_at)
expenses(id, school_id, date, description, category, amount, created_by, created_at)
```

The `daysOverdue` for an arrears student is computed: `(today - fee.due_date)` where the student's `SUM(payments) < fee.amount`.

---

## Implementation Priorities (suggested order)

1. **Auth + School setup wizard** — create school, first admin user, fee structure
2. **Students CRUD** + bulk CSV import (schools usually start with a roster spreadsheet)
3. **Payments screen** — most-used feature, highest value
4. **Arrears screen** — read-only derived view of payments vs fees
5. **Receipt generation** — PDF templates, WhatsApp/email delivery
6. **Expenses screen**
7. **Reports & P&L**
8. **Settings + Notifications integrations** (Twilio for SMS/WhatsApp, SendGrid for email)
9. **Polish:** dark mode, accent picker, export CSV, search

---

## Assets

- **Fonts:** Loaded from Google Fonts CDN — `DM Sans` (preconnect + load in `<head>`)
- **Icons:** All inline SVG in the prototype. Use **Lucide React** in production: `npm i lucide-react`
- **Logo:** Custom SVG (briefcase + dot mark) embedded in the sidebar Logo block — copy the SVG path from the prototype.

---

## Files

- `SchoolPurse Dashboard.html` — Complete reference prototype with all 6 screens, light/dark modes, accent variations, and a Tweaks panel. Self-contained — opens in any browser.

---

## Notes for the Developer

- The prototype uses **inline styles** purely for prototyping speed. In your codebase, lift these into CSS variables, Tailwind classes, or styled-components based on convention.
- All mock data lives at the top of the inline `<script>` block in `SchoolPurse Dashboard.html` (constants `ARREARS`, `PAYMENTS`, `EXPENSES`, `MONTHLY`, `EXP_CATEGORIES`). Match the shape exactly when defining your API responses for a smooth swap.
- The currency is **USD only** for v1. Build the price-rendering as a `formatMoney(amount, currency)` helper so multi-currency (ZWL) can be added later without refactor.
- Schools in Zimbabwe often have **intermittent internet** — consider PWA features for offline payment recording with queued sync.
- Receipts must include school logo, reg number, date, student name, amount in words, signature line — design that as a separate PDF template.
