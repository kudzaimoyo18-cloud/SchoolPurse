# SchoolPurse — AEO Plan (get cited by ChatGPT / Perplexity / Claude / Gemini)

Baseline audit: 72/100 (B-). Gaps = Experience (38) + Structure (40).
Why SchoolPurse can win: the niche (African / Zimbabwe school-fee management) has WEAK
LLM training signal -> low competition, high citation upside. Own the questions now.

## Target queries (the citations to win)
Question-shaped, low-competition, high intent:
1. How do schools in Zimbabwe manage student fees?
2. Best school fee management software for African schools
3. How to track school fees and arrears
4. How to generate school fee receipts automatically
5. How to improve a school's fee collection rate
6. School fee management software that supports mobile money (EcoCash/OneMoney)
7. How much does school fee software cost in Africa?
8. How to move a school from a cash receipt book to digital fees
9. School accounting / bursar software for small schools
10. SchoolPurse review / pricing / features

## Content to build (LLMs cite content, not landing pages)
Create a /guides or /blog + a /faq. Each piece = question H2 + fact-first answer in the
first 200 words + schema. Priority order:

1. **/faq** — ship the 8 Q&As (schema.jsonld already built). Fastest win.
2. **Guide: "How to manage school fees in Zimbabwe (2026)"** — definitive, fact-dense,
   first-person ("we built SchoolPurse after seeing schools lose money to cash books").
3. **Comparison: "Best school fee software for African schools"** — honest table incl.
   SchoolPurse + alternatives. Comparison pages get cited heavily.
4. **How-to: "Generate school fee receipts automatically"** — HowTo schema, step list.
5. **Case study (THE Experience fix): "How [School] went from a cash book to digital fees"**
   — dated, real numbers (students, collection-rate before/after, time saved). First-person.
6. **Glossary** — academic term, fee item, arrears, collection rate. Definitional pages
   get pulled into answers.

## Fix the 2 weak dimensions
EXPERIENCE (38 -> 80+):
- Add a founder byline + bio (Kudzai Moyo, builder) on every content page.
- Publish 1 dated case study with verifiable numbers ("In 2026, X schools onboarded; an
  average school cut fee-reconciliation time from hours to minutes").
- Use first-person evidence in the first 200 words.

STRUCTURE (40 -> 85+):
- Real H2/H3 hierarchy on every page (the audit found 0 H2s).
- Fact-first lede: answer the question in the first sentence, then expand.
- One question = one H2. LLMs extract Q->A pairs.

TRUSTWORTHINESS polish:
- Footer links: contact (support@schoolpurse.app), a short "corrections / accuracy" note,
  last-updated date on each article.

## Schema to inject (file: schema.jsonld)
Organization + SoftwareApplication + FAQPage @graph. Paste in <head>.
Add HowTo schema on the receipt/how-to guide. Never add fake aggregateRating.

## Citation tracking (prove it's working)
When you see schoolpurse.app cited in an LLM answer, log it:
  python scripts/citation_tracker.py --action add --url https://schoolpurse.app/faq \
    --llm perplexity --query "school fee software africa" --date 2026-06-15
Report:
  python scripts/citation_tracker.py --action report --url https://schoolpurse.app/faq

## 30-day cadence
Wk1: ship /faq + schema + footer trust fixes.
Wk2: publish the Zimbabwe fees guide + comparison page.
Wk3: publish the case study (with a real onboarded school) + how-to.
Wk4: glossary + re-audit (target 80+). Start logging citations.