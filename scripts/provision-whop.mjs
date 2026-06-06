// One-off Whop provisioning for SchoolPurse.
//
// Creates (idempotently) the Starter and Standard products + monthly renewal
// plans on your Whop company, then prints each plan's purchase_url (the
// checkout link) as a JSON blob between markers so the caller can write them
// into .env.local.
//
// Run from the SchoolPurse dir:  node scripts/provision-whop.mjs
// Reads WHOP_API_KEY and WHOP_COMPANY_ID from .env.local.
import Whop from "@whop/sdk";
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  const env = {};
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {}
  return env;
}

const env = loadEnvLocal();
const apiKey = process.env.WHOP_API_KEY || env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID || env.WHOP_COMPANY_ID;

if (!apiKey) throw new Error("WHOP_API_KEY not found in env or .env.local");
if (!companyId) throw new Error("WHOP_COMPANY_ID not found in env or .env.local");

const whop = new Whop({ apiKey });

const TIERS = [
  { key: "starter",  title: "SchoolPurse Starter",  ext: "schoolpurse_starter",  price: 29 },
  { key: "standard", title: "SchoolPurse Standard", ext: "schoolpurse_standard", price: 79 },
];

async function findProductByTitle(title) {
  try {
    for await (const product of whop.products.list({ company_id: companyId })) {
      if (product.title === title) return product;
    }
  } catch (e) {
    console.error("  (product list failed, will create new):", e?.message ?? e);
  }
  return null;
}

async function findExistingRenewalPlan(productId, price) {
  try {
    for await (const plan of whop.plans.list({ company_id: companyId })) {
      const pid = plan.product?.id ?? plan.product_id;
      if (pid === productId && plan.plan_type === "renewal" && Number(plan.renewal_price) === price) {
        return plan;
      }
    }
  } catch (e) {
    console.error("  (plan list failed, will create new):", e?.message ?? e);
  }
  return null;
}

const result = {};

for (const t of TIERS) {
  console.error(`\n[${t.key}] resolving product "${t.title}"...`);
  let product = await findProductByTitle(t.title);
  if (product) {
    console.error(`  reusing existing product: ${product.id}`);
  } else {
    product = await whop.products.create({
      company_id: companyId,
      title: t.title,
    });
    console.error(`  created product: ${product.id}`);
  }

  let plan = await findExistingRenewalPlan(product.id, t.price);
  if (plan) {
    console.error(`  reusing existing plan: ${plan.id}`);
  } else {
    console.error(`  creating $${t.price}/mo renewal plan...`);
    plan = await whop.plans.create({
      company_id: companyId,
      product_id: product.id,
      plan_type: "renewal",
      release_method: "buy_now",
      currency: "usd",
      billing_period: 30,
      renewal_price: t.price,
    });
    console.error(`  plan id: ${plan.id}`);
  }

  result[t.key] = {
    product_id: product.id,
    plan_id: plan.id,
    purchase_url: plan.purchase_url,
  };
}

console.log("---SCHOOLPURSE_WHOP_RESULT_BEGIN---");
console.log(JSON.stringify(result, null, 2));
console.log("---SCHOOLPURSE_WHOP_RESULT_END---");
