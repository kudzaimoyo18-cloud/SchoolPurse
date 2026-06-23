# SchoolPurse — Corporate Overview

*Internal / partner-facing. Last updated June 2026. Competitor pricing is publicly listed or estimated and should be re-verified quarterly.*

## 1. Snapshot
**SchoolPurse is fee-management software for African schools.** It lets a school invoice term fees, record payments (cash, bank transfer, mobile money), issue instant numbered receipts, and see arrears and collection rate in real time — without changing how parents pay.

- **Category:** School finance / fee management (a focused tool, not a full school ERP)
- **Built for:** private, independent, mission and trust schools in Zimbabwe, expanding across Africa
- **Founded:** 2026, Harare, Zimbabwe · Founder: Kudzai Moyo
- **Stage:** live product, early go-to-market
- **Live at:** schoolpurse.app · support@schoolpurse.app

## 2. The problem
Most African schools still run fees on a paper receipt book or a drifting spreadsheet. The result:
- Receipts that are not numbered and cannot be traced.
- Cash and bank totals that never quite agree.
- Arrears that stay invisible until the term is over — too late to recover.
- A bursar who, by one industry account, can take **~3 weeks to produce an outstanding-fees report** that is already out of date by the time it lands.

The money is hardest to see exactly when the school is busiest — and that is where fees leak.

## 3. The product
A focused workflow that mirrors how a bursar actually works:
1. **Fee items** mapped to classes (tuition, levy, sports, exams, transport).
2. **Term invoicing** — every active student billed the right amount in one batch.
3. **Payment recording** — cash, bank transfer, or mobile money (EcoCash / OneMoney / InnBucks).
4. **Instant receipts** — sequential, branded (e.g. TSJS-2026-000412), print or send.
5. **Live arrears + collection rate** — who owes, largest first, any day of the term.
6. **Reports & P&L** — income vs expenses, term by term.
7. **Roles** — head sees all, bursar sees finance, teacher sees only students; each school's data isolated by row-level security.

Runs on any browser and low-end Android. Set up in under 30 minutes.

## 4. Market
- **Zimbabwe:** thousands of fee-charging private, mission, independent and trust schools — the immediate, reachable beachhead. WhatsApp-first, USD-invoicing, mobile-money paying.
- **Africa:** hundreds of thousands of fee-charging schools with the same paper/spreadsheet problem and the same mobile-money rails.
- **Wedge:** win Zimbabwe on local fit (USD, EcoCash, Zim terms, low-end Android), then expand to markets with identical dynamics (Zambia, Malawi, Kenya, Nigeria).

## 5. Business model
SaaS subscription, billed monthly, no setup fee:
| Plan | Price | Capacity |
|------|-------|----------|
| Starter | $29/mo | up to 200 students |
| Standard | $79/mo | up to 1,000 students |
| Plus | custom | larger groups & trusts |

Positioned deliberately below full-ERP pricing: a school recovers the cost in the fees it stops losing in a single untracked term.

## 6. Competitive landscape
See `competitor-intel.md` for the full profiles. Summary:

| | Focus | Local pay (USD/EcoCash) | Mobile/low-end | Instant receipts | Setup | Pricing |
|---|---|---|---|---|---|---|
| **SchoolPurse** | **Fees, done right** | **Yes** | **Yes** | **Yes** | **<30 min** | **$29–79/mo** |
| Spreadsheet + cash book | None | Manual | n/a | No | n/a | "Free" (hidden cost: leakage) |
| Sekani (ZW) | School mgmt + fees | Yes (USD/ZWL) | Web | Yes | Medium | On request |
| Smart School Manager / Genius (ZW) | Full ERP | Partial | Web | Yes | Heavy | ERP-tier |
| Fedena (global) | Full ERP (50+ modules) | Needs customization | Web | Yes | Heavy | from ~$1,000+/yr |
| Edves / Zeraki (NG/KE) | Full ERP + LMS | Local rails (M-Pesa etc.) | Yes | Yes | Heavy | Tiered |

### Positioning
**SchoolPurse competes by being narrow on purpose.** The market is split between (a) paper/Excel and (b) heavy all-in-one ERPs (academics, LMS, exams, HR, attendance) that are expensive, slow to roll out, and more than a school that "just needs fees done right" wants to buy or run. SchoolPurse sits in the gap: the focused, affordable, fast-to-adopt fee tool, tuned for Zimbabwe first.

### Honest differentiation
- **Focus** — does fees deeply, not 50 modules shallowly.
- **Local fit** — USD + EcoCash/OneMoney/InnBucks + 3-term structure + low-end Android, out of the box.
- **Speed to value** — usable in under 30 minutes; receipts and arrears from day one.
- **Price** — entry at $29/mo vs ERP tiers.
- **Founder-led, local** — built in Harare, sold by someone who understands the bursar's day.

## 7. Honest weaknesses / risks
- **Not a full ERP** — no academics, LMS, exams, timetabling, HR or attendance. Schools wanting all-in-one will prefer Sekani / Edves / Fedena.
- **Early & small** — new brand, limited track record, no large reference base yet.
- **Single-market concentration** — Zimbabwe macro (currency, connectivity) is a risk and a moat.
- **Tracking, not a gateway** — does not move money; relies on schools recording payments (by design, but a perceived gap to some).

## 8. Traction & status (June 2026)
- Live, paying-ready product with Whop billing, magic-link onboarding, and role-based access.
- Domain on Cloudflare; transactional + auth email via Resend; `support@schoolpurse.app` live.
- Two AEO-optimized, citable content surfaces live (`/faq`, `/guides/manage-school-fees-zimbabwe`).
- Go-to-market assets built: 30s vertical promo video, social design set, email sequence, ad copy, content calendar.

## 9. Technology
Next.js + Supabase (Postgres, Auth, row-level security) · Vercel · Cloudflare (DNS + email routing) · Resend · Whop (billing). Multi-tenant, audit-preserving (payments are voided, never hard-deleted).

## 10. Go-to-market
Founder-led, WhatsApp- and demo-first: cold outreach to heads/bursars offering a free demo loaded with their classes, amplified by build-in-public content on `@kudz.automation` and a Zimbabwe-targeted paid-social push. (Full plan in the campaign assets.)

## 11. Roadmap (indicative)
- Self-service academic year/term setup; richer reporting.
- Optional mobile-money reconciliation; parent receipt delivery via WhatsApp.
- Multi-currency (ZWG/ZiG) and multi-school groups/trusts.
- Expansion to a second African market on the same rails.

## 12. The one-line pitch
*Stop guessing where your school's fees are. SchoolPurse shows you — live — who has paid, who owes, and prints the receipt the moment money comes in. Built in Harare, for African schools.*