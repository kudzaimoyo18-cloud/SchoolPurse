import { chromium } from "playwright";
import fs from "fs";
import path from "path";
const abs = (rel) => "file://" + path.resolve(rel).replace(/\\/g, "/");
const logo = abs("../assets/logo.png");
const classroom = abs("../campaign/assets/school-28593051.jpg");
const desk = abs("../campaign/assets/pexels-6694492.jpg");

const CSS = `
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:0}
html{font-family:'Segoe UI',system-ui,Arial,sans-serif;color:#16222f;font-size:11pt;line-height:1.5}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;background:#fff}
.page:last-child{page-break-after:auto}
.pad{padding:20mm 18mm}
h1,h2,h3{letter-spacing:-.3px;color:#0f2238}
.kick{font-size:10pt;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#2f7fd1}
.muted{color:#5b6b7d}
.accent{color:#2f7fd1}
/* cover */
.cover{position:absolute;inset:0;background:url('${classroom}') center 30%/cover}
.cover-ov{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,18,32,.82) 0%,rgba(8,18,32,.42) 28%,rgba(8,18,32,.5) 46%,rgba(8,18,32,.9) 66%,rgba(6,14,24,.98) 100%)}
.cover-wrap{position:absolute;inset:0;color:#fff;padding:22mm 18mm;display:flex;flex-direction:column;justify-content:space-between}
.brand{display:flex;align-items:center;gap:10px}
.brand img{width:46px;height:46px;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.4)}
.brand .w{font-size:22pt;font-weight:800}.brand .w b{color:#6cc0ff}
.cover-wrap h1{color:#fff;font-size:46pt;line-height:1.0;margin:8px 0 14px}
.cover .tl{font-size:17pt;font-weight:500;color:#dce8f6;max-width:150mm}
.cover .meta{font-size:10.5pt;color:#aebfd2;font-weight:600;letter-spacing:.3px}
.cover-kick{color:#6cc0ff}
/* section header */
.sh{display:flex;align-items:center;gap:12px;border-bottom:2px solid #e6edf5;padding-bottom:10px;margin-bottom:16px}
.sh .n{width:34px;height:34px;border-radius:9px;background:#15314f;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13pt;flex:0 0 auto}
.sh h2{font-size:21pt}
p{margin:0 0 9px}
.lead{font-size:12.5pt;color:#2a3a4b}
.callout{background:#eaf2fb;border-left:4px solid #2f7fd1;border-radius:10px;padding:13px 16px;margin:12px 0;font-size:11pt}
.callout b{color:#15314f}
.steps{margin:8px 0}
.step{display:flex;gap:12px;margin:9px 0}
.step .d{width:26px;height:26px;border-radius:50%;background:#2f7fd1;color:#fff;font-weight:800;font-size:10pt;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.step b{color:#15314f}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.cardb{border:1px solid #e6edf5;border-radius:12px;padding:14px 16px;background:#fafcff}
.cardb h3{font-size:12pt;margin-bottom:5px}
.photo{width:100%;height:46mm;object-fit:cover;border-radius:12px;margin:6px 0 4px;box-shadow:0 8px 24px rgba(15,34,56,.14)}
table{width:100%;border-collapse:collapse;font-size:9.6pt;margin:6px 0}
th,td{text-align:left;padding:8px 9px;border-bottom:1px solid #e8eef6}
th{background:#15314f;color:#fff;font-weight:700}
.matrix td:first-child{font-weight:700;color:#15314f}
.matrix td{text-align:center}.matrix td:first-child{text-align:left}
.yes{color:#16a06a;font-weight:800}.no{color:#cdd7e2;font-weight:800}
.price th{background:#15314f}.price td b{color:#15314f;font-size:13pt}
.pill{display:inline-block;background:#eaf2fb;color:#15314f;font-weight:700;font-size:9.5pt;padding:4px 10px;border-radius:999px;margin:2px 4px 2px 0}
.weak li{margin:5px 0}
ul{margin:4px 0 8px 18px}li{margin:4px 0}
.bigq{font-size:18pt;font-weight:800;color:#15314f;line-height:1.25;margin:6px 0}
.footer{position:absolute;left:0;right:0;bottom:0;background:#0f2238;color:#cfe0f2;padding:9mm 18mm;display:flex;justify-content:space-between;font-size:10pt}
.footer b{color:#fff}
.pageno{position:absolute;bottom:8mm;right:14mm;color:#9fb1c4;font-size:9pt;font-weight:700}
`;

const matrix = `
<table class="matrix"><tr><th>Capability</th><th>SchoolPurse</th><th>Spreadsheet</th><th>Sekani</th><th>Genius/ERP</th><th>Fedena</th></tr>
<tr><td>Fee focus (not bloated)</td><td class="yes">Best</td><td>&#8211;</td><td>Partial</td><td class="no">ERP</td><td class="no">ERP</td></tr>
<tr><td>USD + EcoCash / mobile money</td><td class="yes">Native</td><td>Manual</td><td class="yes">Yes</td><td>Partial</td><td>Setup</td></tr>
<tr><td>Instant numbered receipts</td><td class="yes">Yes</td><td class="no">No</td><td class="yes">Yes</td><td class="yes">Yes</td><td class="yes">Yes</td></tr>
<tr><td>Live arrears + collection rate</td><td class="yes">Yes</td><td class="no">No</td><td class="yes">Yes</td><td class="yes">Yes</td><td class="yes">Yes</td></tr>
<tr><td>Low-end Android friendly</td><td class="yes">Yes</td><td>&#8211;</td><td>Web</td><td>Web</td><td>Web</td></tr>
<tr><td>Setup time</td><td class="yes">&lt;30 min</td><td>&#8211;</td><td>Medium</td><td>Heavy</td><td>Heavy</td></tr>
<tr><td>Entry price</td><td class="yes">$29/mo</td><td>"free"</td><td>On req.</td><td>ERP-tier</td><td>~$1k+/yr</td></tr>
<tr><td>Built for Zimbabwe</td><td class="yes">Yes</td><td>&#8211;</td><td class="yes">Yes</td><td>Page</td><td class="no">No</td></tr></table>`;

const pages = `
<div class="page"><div class="cover"></div><div class="cover-ov"></div>
  <div class="cover-wrap">
    <div class="brand"><img src="${logo}"><div class="w">School<b>Purse</b></div></div>
    <div>
      <div class="kick cover-kick">Company Overview</div>
      <h1>Fee management,<br>built for African schools.</h1>
      <div class="tl">SchoolPurse shows a school &#8212; live &#8212; who has paid, who owes, and prints the receipt the moment money comes in.</div>
      <div class="meta" style="margin-top:12mm">schoolpurse.app &nbsp;&#183;&nbsp; Harare, Zimbabwe &nbsp;&#183;&nbsp; June 2026</div>
    </div>
  </div>
</div>

<div class="page"><div class="pad">
  <div class="sh"><div class="n">1</div><h2>The problem we solve</h2></div>
  <p class="lead">Most African schools still run fees on a paper receipt book or a drifting spreadsheet. The money is hardest to see exactly when the school is busiest &#8212; and that is where fees leak.</p>
  <ul>
    <li>Receipts that are not numbered and cannot be traced.</li>
    <li>Cash and bank totals that never quite agree.</li>
    <li>Arrears invisible until the term is over &#8212; too late to recover.</li>
  </ul>
  <div class="callout">By one industry account, a bursar can take <b>~3 weeks to produce an outstanding-fees report</b> &#8212; and it is already out of date by the time it lands.</div>
  <img class="photo" src="${desk}">
  <div class="sh" style="margin-top:14px"><div class="n">2</div><h2>What SchoolPurse does</h2></div>
  <div class="steps">
    <div class="step"><div class="d">1</div><div><b>Fee items</b> mapped to classes &#8212; tuition, levy, sports, exams, transport.</div></div>
    <div class="step"><div class="d">2</div><div><b>Term invoicing</b> &#8212; every active student billed the right amount in one batch.</div></div>
    <div class="step"><div class="d">3</div><div><b>Record payments</b> by cash, bank transfer, or mobile money (EcoCash / OneMoney / InnBucks).</div></div>
    <div class="step"><div class="d">4</div><div><b>Instant receipts</b> &#8212; sequential, branded, print or send.</div></div>
    <div class="step"><div class="d">5</div><div><b>Live arrears + collection rate</b> &#8212; who owes, largest first, any day of the term.</div></div>
    <div class="step"><div class="d">6</div><div><b>Roles &amp; isolation</b> &#8212; head sees all, bursar sees finance, teacher sees students; each school&#39;s data isolated.</div></div>
  </div>
  <div class="pageno">2</div>
</div></div>

<div class="page"><div class="pad">
  <div class="sh"><div class="n">3</div><h2>Market &amp; business model</h2></div>
  <p class="lead">Win Zimbabwe on local fit, then expand across Africa on the same rails.</p>
  <div class="grid2" style="margin:8px 0 14px">
    <div class="cardb"><h3>Beachhead &#8212; Zimbabwe</h3>Thousands of fee-charging private, mission, independent and trust schools. WhatsApp-first, USD-invoicing, mobile-money paying.</div>
    <div class="cardb"><h3>Expansion &#8212; Africa</h3>Hundreds of thousands of schools with the same paper/spreadsheet problem and the same mobile-money rails (Zambia, Malawi, Kenya, Nigeria).</div>
  </div>
  <h3 style="margin:6px 0">Pricing &#8212; SaaS, billed monthly, no setup fee</h3>
  <table class="price"><tr><th>Plan</th><th>Price</th><th>Capacity</th></tr>
    <tr><td><b>Starter</b></td><td>$29 / month</td><td>up to 200 students</td></tr>
    <tr><td><b>Standard</b></td><td>$79 / month</td><td>up to 1,000 students</td></tr>
    <tr><td><b>Plus</b></td><td>custom</td><td>larger groups &amp; trusts</td></tr></table>
  <div class="callout" style="margin-top:14px">Priced deliberately below full-ERP tiers: a school recovers the cost in the fees it stops losing in a single untracked term.</div>
  <div class="pageno">3</div>
</div></div>

<div class="page"><div class="pad">
  <div class="sh"><div class="n">4</div><h2>Competitive landscape</h2></div>
  <p class="lead">The market is split between paper/Excel and heavy all-in-one ERPs. <span class="accent">SchoolPurse wins by being narrow on purpose</span> &#8212; the focused, affordable, fast-to-adopt fee tool, tuned for Zimbabwe first.</p>
  ${matrix}
  <div class="grid2" style="margin-top:12px">
    <div class="cardb"><h3 class="accent">Why we win</h3><ul><li>Does fees deeply, not 50 modules shallowly.</li><li>USD + EcoCash + 3-term + low-end Android, out of the box.</li><li>Usable in under 30 minutes.</li><li>Founder-led and local.</li></ul></div>
    <div class="cardb weak"><h3>Honest weaknesses</h3><ul><li>Not a full ERP (no LMS, exams, HR, attendance).</li><li>Early &amp; small &#8212; new brand, growing track record.</li><li>Tracking, not a payment gateway.</li></ul></div>
  </div>
  <div class="pageno">4</div>
</div></div>

<div class="page"><div class="pad">
  <div class="sh"><div class="n">5</div><h2>Traction, technology &amp; what&#39;s next</h2></div>
  <div class="grid2">
    <div class="cardb"><h3 class="accent">Status (June 2026)</h3><ul><li>Live, billing-ready product.</li><li>Passwordless onboarding &amp; role-based access.</li><li>Two AEO-optimized, citable web pages live.</li><li>Full GTM kit built: promo video, social designs, email + ad copy.</li></ul></div>
    <div class="cardb"><h3 class="accent">Technology</h3><ul><li>Next.js + Supabase (Postgres, RLS).</li><li>Vercel &#183; Cloudflare &#183; Resend &#183; Whop billing.</li><li>Multi-tenant, audit-preserving (payments voided, never hard-deleted).</li></ul></div>
  </div>
  <h3 style="margin:14px 0 4px">Roadmap (indicative)</h3>
  <div><span class="pill">Self-serve term setup</span><span class="pill">WhatsApp receipt delivery</span><span class="pill">Mobile-money reconciliation</span><span class="pill">Multi-currency (ZWG)</span><span class="pill">Multi-school groups</span><span class="pill">Second African market</span></div>
  <div class="bigq" style="margin-top:20px">&#8220;Stop guessing where your school&#39;s fees are. SchoolPurse shows you &#8212; live &#8212; who has paid, who owes, and prints the receipt the moment money comes in.&#8221;</div>
  <div class="footer"><div><b>SchoolPurse</b> &#183; Built in Harare for African schools</div><div><b>schoolpurse.app</b> &#183; support@schoolpurse.app</div></div>
</div></div>`;

const doc = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${pages}</body></html>`;
fs.writeFileSync("overview.html", doc);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(abs("overview.html"), { waitUntil: "networkidle" });
await page.pdf({ path: "SchoolPurse-Corporate-Overview.pdf", format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log("PDF written: SchoolPurse-Corporate-Overview.pdf");