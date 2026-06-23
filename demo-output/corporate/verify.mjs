import { chromium } from "playwright";
import path from "path";
const abs = (rel) => "file://" + path.resolve(rel).replace(/\\/g, "/");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
await page.goto(abs("overview.html"), { waitUntil: "networkidle" });
const els = await page.$$(".page");
for (let i = 0; i < els.length; i++) {
  await els[i].screenshot({ path: `pageview-${i + 1}.png` });
}
await browser.close();
console.log("screenshotted", els.length, "pages");