# SchoolPurse — Freemium + AI plan

_Decided 2026-06-18 with Kudzai. Strategy: free tier as the wedge into every Zim
school office; AI + WhatsApp automation as the paid upsell._

## 1. Strategy

- **Free** removes the adoption barrier — a school can run its whole fee book for
  up to 100 students at no cost. Near-zero marginal cost to us (no AI, no
  WhatsApp).
- **Paid** sells outcomes that touch money: get paid faster (WhatsApp arrears
  reminders) and answer any finance question instantly (AI dashboard chat).
- Most of the **Pro** feature set already exists in the codebase, so launching
  freemium is mostly *enforcement + a pricing page*, not new building.

## 2. Tiers

### Free — $0  (≤100 active students, 1 user)
- Record payments (cash / transfer / EcoCash)
- Receipts (print + PDF + WhatsApp share)
- Arrears dashboard + carry-over balances
- Basic term-fee setup
- 1 admin user only

### Pro — $25/mo
- Unlimited students
- Multi-user + roles (head / bursar / teacher) — _already built_
- Expenses + monthly P&L — _already built_
- Parent statements (PDF)
- Bulk fee reminders (manual / SMS, non-AI)
- Multi-term history, CSV exports, audit log
- USD + ZiG duality

### AI — $59/mo  (Pro + the smart layer)
- **AI dashboard chat** — ask the school's finances in plain English/Shona
- **Automated WhatsApp arrears reminders** — AI-drafted, personalized
- AI WhatsApp staff assistant (text a balance, get an answer) — later
- OCR EcoCash/bank statement reconciliation — later
- End-of-term board report + default-risk flags — later
- Voice entry (Shona/Ndebele/English) — later

Annual: pay 10 months, get 12. Bill via **Paynow (EcoCash/OneMoney/card)** for
local schools in addition to card.

## 3. Limit enforcement

- **100-student cap:** count *active* students (withdrawn excluded). At 100,
  "Add student" and CSV import block with an upgrade modal. Existing data stays
  fully usable (view, record payments, receipts) — non-punitive.
- **1-user cap (free):** "Invite teammate" blocked on free; prompts upgrade.
- Implementation: a `plan` (free/pro/ai) on the school (or via the existing Whop
  entitlement). Gate checks in `enrollChild`, `importStudentsCsv` (student
  count) and team-invite action (user count). Plans map to Whop products.

## 4. Pricing / unit-cost model

| Cost | Estimate | Notes |
|---|---|---|
| AI dashboard chat | ~$0.003–0.01 / query | Heavy school < $5/mo. Negligible. |
| WhatsApp Business API | ~$0.02–0.04 / msg (Africa tier) + BSP fee | 200-family school reminding monthly ≈ $5–10/mo. Main cost driver. |
| Free tier | ~$0 | No AI / WhatsApp. |

AI-tier marginal cost ≈ **$5–15/school/mo** → $59 leaves a healthy margin.
Consider a fair-use cap on reminders (e.g. 500/mo) before overage.

## 5. AI dashboard chat — v1 architecture

Goal: "ask your data" over one school's finances, safely and cheaply.

- **Tool-calling, not free-form SQL (v1).** Define a fixed set of read-only,
  parameterized queries the model can call:
  - arrears list / total outstanding (optionally by class)
  - collection rate for a term
  - payments by method and date range (cash vs EcoCash vs transfer)
  - top debtors (N)
  - student balance lookup by name
  - monthly P&L / income vs expenses
- **Tenancy:** every tool runs RLS-scoped to the caller's `school_id`. Never
  cross-tenant. Reuse existing Supabase RLS + the `aggregateArrears` /
  `monthly-pl` query layer already in the repo.
- **Read-only in v1** — no writes via chat. Each answer cites the underlying
  query ("based on 14 open invoices").
- **Model:** Claude Haiku/Sonnet; cache the system prompt + schema description.
- **Surface:** a chat panel in the dashboard. The WhatsApp staff bot later reuses
  the same tool layer.
- NL→SQL (read-only RLS role + guardrails) is a *later* upgrade once the tool
  approach proves out.

## 6. WhatsApp (phase after chat)

- BSP: 360dialog or Twilio WhatsApp Business API.
- Arrears reminders: approved utility/marketing templates, personalized
  (student name, balance, term). Scheduled + bulk, with opt-out.
- Staff assistant: inbound "balance for <name>" → same tool layer → reply.
- Cost: per-message (see model). Bundle an allowance per plan.

## 7. Zim feature backlog (current tech × local need)

- OCR reconciliation: photo/upload of EcoCash or bank statement → auto-match
  payments (removes the manual-entry adoption blocker).
- Voice entry in Shona/Ndebele/English ("Tatenda paid fifty dollars cash").
- Default-risk flags from payment history (intervene before term close).
- USD + ZiG duality with rate tracking.
- Paynow billing (EcoCash/OneMoney) for our own subscriptions.
- Offline-tolerant PWA (load-shedding, data cost) — works on cheap Android.

## 8. Build phases

1. **Freemium structure (now):** plan field + 100-student/1-user gates +
   upgrade modals + Free/Pro/AI pricing page. (Mostly enforcement.)
2. **Pro polish:** parent statements (PDF), export polish. (Multi-user, P&L,
   roles already exist.)
3. **AI dashboard chat** (tool-calling v1).
4. **WhatsApp** arrears reminders + staff assistant.
5. **OCR reconciliation, risk flags, voice.**

## 9. Metrics

- Free→paid conversion; activation = school records ≥1 payment.
- Arrears recovered via WhatsApp reminders (the ROI story for case studies).
- Students per free school (cap-pressure → upgrade signal).

## 10. Outreach implication

The **free-for-100-students** offer is a stronger cold-email hook than
"founding partner free." Lead outreach with the free tier; mention AI/WhatsApp
as what paid unlocks. Founding-partner framing now applies to *paid* features
(free Pro/AI for early reference schools).
