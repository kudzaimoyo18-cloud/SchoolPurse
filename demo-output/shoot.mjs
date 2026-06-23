import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const W = 1080, H = 1920;
fs.mkdirSync('frames', { recursive: true });
fs.mkdirSync('scenes', { recursive: true });
const logo = 'file://' + path.resolve('assets/logo.png').replace(/\\/g, '/');

const CSS = `
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
html,body{width:${W}px;height:${H}px;overflow:hidden;font-family:'Segoe UI',system-ui,Arial,sans-serif;color:#fff}
.stage{width:${W}px;height:${H}px;position:relative;display:flex;flex-direction:column;justify-content:center;padding:120px 90px}
.navy{background:radial-gradient(120% 90% at 50% 0%,#234a73 0%,#15314f 45%,#0a1726 100%)}
.dark{background:radial-gradient(120% 90% at 50% 30%,#3a1626 0%,#1a1018 55%,#0a0a0e 100%)}
.handle{position:absolute;top:90px;left:90px;font-size:34px;font-weight:600;color:#6cc0ff;letter-spacing:.5px}
.kick{font-size:34px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6cc0ff;margin-bottom:28px}
.kick.red{color:#ff8095}
h1{font-size:116px;line-height:1.03;font-weight:800;letter-spacing:-2px}
.accent{color:#6cc0ff}
.sub{font-size:46px;line-height:1.3;font-weight:500;color:#c9d8ea;margin-top:36px}
.row{display:flex;align-items:center;gap:28px;margin:26px 0;font-size:52px;font-weight:600}
.x{width:64px;height:64px;border-radius:50%;background:#ff5470;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800;flex:0 0 auto}
.foot{position:absolute;bottom:90px;left:0;width:100%;text-align:center;font-size:40px;color:#9fb4cc;font-weight:600}
.logowrap{display:flex;flex-direction:column;align-items:center;gap:40px}
.logoimg{width:300px;height:300px;border-radius:64px;box-shadow:0 30px 90px rgba(108,192,255,.35);object-fit:cover}
.word{font-size:96px;font-weight:800;letter-spacing:-1px}
.word b{color:#6cc0ff}
.cap{font-size:60px;font-weight:800;text-align:center;line-height:1.1;margin-bottom:48px}
.phone{width:560px;height:1140px;margin:0 auto;border-radius:78px;background:#0c1622;border:14px solid #243a55;box-shadow:0 40px 120px rgba(0,0,0,.55);overflow:hidden;position:relative}
.notch{position:absolute;top:26px;left:50%;transform:translateX(-50%);width:150px;height:34px;background:#0c1622;border-radius:20px;z-index:5}
.app{position:absolute;inset:0;background:#f4f7fb;color:#0f1f33;display:flex;flex-direction:column}
.appbar{background:#15314f;color:#fff;padding:64px 36px 26px;display:flex;flex-direction:column;gap:4px}
.appbar .t{font-size:34px;font-weight:800}.appbar .s{font-size:24px;color:#9fc4ec}
.cards{padding:30px 30px 8px;display:grid;grid-template-columns:1fr 1fr;gap:22px}
.card{background:#fff;border:1px solid #e4ecf5;border-radius:28px;padding:26px}
.card .l{font-size:21px;color:#6b7d93;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.card .v{font-size:50px;font-weight:800;margin-top:8px;color:#15314f}
.card .v.g{color:#16a06a}.card .v.r{color:#e05260}
.chart{margin:24px 30px;background:#fff;border:1px solid #e4ecf5;border-radius:28px;padding:26px 26px 18px}
.chart .h{font-size:24px;font-weight:800;color:#15314f;margin-bottom:18px}
.bars{display:flex;align-items:flex-end;gap:16px;height:200px}
.bar{flex:1;background:linear-gradient(180deg,#6cc0ff,#2f7fd1);border-radius:12px 12px 0 0}
.succ{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;text-align:center;padding:40px}
.bigtick{width:170px;height:170px;border-radius:50%;background:#22c98a;display:flex;align-items:center;justify-content:center;font-size:96px;color:#fff;box-shadow:0 18px 50px rgba(34,201,138,.45)}
.succ .t{font-size:42px;font-weight:800;color:#15314f}
.amt{font-size:84px;font-weight:800;color:#15314f}
.rcpt{font-size:26px;color:#6b7d93;font-weight:700}
.btns{display:flex;gap:18px;margin-top:14px}
.btn{padding:22px 34px;border-radius:20px;font-size:28px;font-weight:800}
.btn.p{background:#15314f;color:#fff}.btn.o{background:#eaf1f9;color:#15314f}
.list{flex:1;padding:24px 30px;display:flex;flex-direction:column;gap:18px;overflow:hidden}
.li{background:#fff;border:1px solid #e4ecf5;border-radius:24px;padding:26px 30px;display:flex;justify-content:space-between;align-items:center}
.li .n{font-size:34px;font-weight:700;color:#15314f}.li .c{font-size:24px;color:#8294a8}
.li .o{font-size:40px;font-weight:800;color:#e05260}
.cta-url{font-size:104px;font-weight:800;color:#6cc0ff;letter-spacing:-1px}
.cta-tag{font-size:50px;font-weight:600;color:#cfe0f2;margin-top:24px}
.cta-follow{position:absolute;bottom:120px;left:0;width:100%;text-align:center;font-size:44px;font-weight:700;color:#9fb4cc}
.cta-follow b{color:#6cc0ff}
`;

const phoneApp = (inner) => `<div class="phone"><div class="notch"></div><div class="app">${inner}</div></div>`;

const dash = phoneApp(`
  <div class="appbar"><div class="t">Twinkle Star Junior</div><div class="s">Term 2 &#183; 2026</div></div>
  <div class="cards">
    <div class="card"><div class="l">Today</div><div class="v g">$480</div></div>
    <div class="card"><div class="l">This month</div><div class="v">$12,400</div></div>
    <div class="card"><div class="l">Outstanding</div><div class="v r">$3,150</div></div>
    <div class="card"><div class="l">Collected</div><div class="v g">78%</div></div>
  </div>
  <div class="chart"><div class="h">Income &#183; last 6 months</div>
    <div class="bars">
      <div class="bar" style="height:46%"></div><div class="bar" style="height:62%"></div>
      <div class="bar" style="height:54%"></div><div class="bar" style="height:78%"></div>
      <div class="bar" style="height:70%"></div><div class="bar" style="height:92%"></div>
    </div>
  </div>`);

const receipt = phoneApp(`
  <div class="appbar"><div class="t">Record payment</div><div class="s">Twinkle Star Junior</div></div>
  <div class="succ">
    <div class="bigtick">&#10003;</div>
    <div class="t">Payment recorded</div>
    <div class="amt">$120.00</div>
    <div class="rcpt">Tariro Moyo &#183; Grade 5</div>
    <div class="rcpt">Receipt&nbsp; TSJS-2026-000412</div>
    <div class="btns"><div class="btn p">Print</div><div class="btn o">Email</div></div>
  </div>`);

const arrears = phoneApp(`
  <div class="appbar"><div class="t">Arrears</div><div class="s">Largest balances first</div></div>
  <div class="list">
    <div class="li"><div><div class="n">Rudo Chikore</div><div class="c">Grade 6</div></div><div class="o">$420</div></div>
    <div class="li"><div><div class="n">Tendai Banda</div><div class="c">Grade 3</div></div><div class="o">$300</div></div>
    <div class="li"><div><div class="n">Anesu Dube</div><div class="c">Grade 7</div></div><div class="o">$255</div></div>
    <div class="li"><div><div class="n">Farai Nyathi</div><div class="c">Grade 2</div></div><div class="o">$180</div></div>
    <div class="li"><div><div class="n">Chipo Sibanda</div><div class="c">Grade 4</div></div><div class="o">$150</div></div>
  </div>`);

const scenes = [
  { id:'01-hook', cls:'navy', body:`
    <div class="handle">@kudz.automation</div>
    <h1>I built a school&#39;s <span class="accent">entire payment system</span> in a weekend.</h1>
    <div class="foot">keep watching &#8595;</div>` },
  { id:'02-problem', cls:'dark', body:`
    <div class="kick red">The old way</div>
    <div class="row"><div class="x">&#10005;</div>Cash stuffed in envelopes</div>
    <div class="row"><div class="x">&#10005;</div>Receipts in a paper notebook</div>
    <div class="row"><div class="x">&#10005;</div>No real idea who has paid</div>` },
  { id:'03-solution', cls:'navy', body:`
    <div class="logowrap">
      <img class="logoimg" src="${logo}">
      <div class="word">School<b>Purse</b></div>
      <div class="sub" style="text-align:center">Every fee. Every payment.<br>Every receipt. One app.</div>
    </div>` },
  { id:'04-dashboard', cls:'navy', body:`<div class="cap">Collections, <span class="accent">live</span>.</div>${dash}` },
  { id:'05-receipt', cls:'navy', body:`<div class="cap">Record a payment.<br>Receipt in <span class="accent">seconds</span>.</div>${receipt}` },
  { id:'06-arrears', cls:'navy', body:`<div class="cap">Know exactly <span class="accent">who owes what</span>.</div>${arrears}` },
  { id:'07-cta', cls:'navy', body:`
    <div class="logowrap" style="gap:30px">
      <img class="logoimg" src="${logo}" style="width:200px;height:200px">
      <div class="cta-url">schoolpurse.app</div>
      <div class="cta-tag">Built for African schools.</div>
    </div>
    <div class="cta-follow">Follow <b>@kudz.automation</b> for the build</div>` },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport:{width:W,height:H}, deviceScaleFactor:1 });
for (const s of scenes) {
  const file = path.join('scenes', s.id + '.html');
  fs.writeFileSync(file, `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="stage ${s.cls}">${s.body}</div></body></html>`);
  await page.goto('file://' + path.resolve(file).replace(/\\/g,'/'));
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join('frames', s.id + '.png') });
  console.log('shot', s.id);
}
await browser.close();
console.log('ALL FRAMES DONE');