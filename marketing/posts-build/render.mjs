import { chromium } from "playwright";
import path from "path";
const dir = "C:/Users/SAMIM A1/Desktop/NEW PROJECTS/SchoolPurse/marketing";
const out = dir + "/posts";
const file = "file:///" + (dir + "/posts-build/posts.html");
const map = { p01:"01-teaser", p02:"02-announcement", p03:"03-arrears", p06:"06-security", p07:"07-zimbabwe" };
const b = await chromium.launch();
const pg = await b.newPage({ viewport:{ width:1080, height:1350 }, deviceScaleFactor:2 });
await pg.goto(file, { waitUntil:"networkidle" });
try { await pg.evaluate(() => document.fonts.ready); } catch(e){}
await pg.waitForTimeout(600);
for (const [id,name] of Object.entries(map)) {
  const el = await pg.$("#"+id);
  await el.screenshot({ path: path.join(out, name+".png") });
  console.log("shot", name);
}
await b.close();
