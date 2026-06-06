import { describe, it, expect, beforeEach, vi } from "vitest";
import { Webhook } from "standardwebhooks";

// whop.ts imports "server-only", which throws under the default (non
// react-server) resolve condition vitest uses. Stub it so the module loads.
vi.mock("server-only", () => ({}));

// A Standard Webhooks secret is "whsec_" + base64. The Whop SDK passes this
// raw string to standardwebhooks, which strips the prefix and base64-decodes
// the remainder to derive the HMAC key. These tests lock in that contract.
const SECRET = "whsec_" + Buffer.from("schoolpurse-test-signing-key").toString("base64");

function signedHeaders(payload: string): Record<string, string> {
  const wh = new Webhook(SECRET);
  const msgId = "msg_test_123";
  const timestamp = new Date();
  const signature = wh.sign(msgId, timestamp, payload);
  return {
    "webhook-id": msgId,
    "webhook-timestamp": Math.floor(timestamp.getTime() / 1000).toString(),
    "webhook-signature": signature,
  };
}

describe("productIdToTier", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.WHOP_STARTER_PRODUCT_ID = "prod_starter";
    process.env.WHOP_STANDARD_PRODUCT_ID = "prod_standard";
    process.env.WHOP_PLUS_PRODUCT_ID = "prod_plus";
  });

  it("maps known product ids to their tier", async () => {
    const { productIdToTier } = await import("./whop");
    expect(productIdToTier("prod_starter")).toBe("starter");
    expect(productIdToTier("prod_standard")).toBe("standard");
    expect(productIdToTier("prod_plus")).toBe("plus");
  });

  it("returns undefined for an unknown product id", async () => {
    const { productIdToTier } = await import("./whop");
    expect(productIdToTier("prod_unknown")).toBeUndefined();
  });

  it("returns undefined for an empty product id", async () => {
    const { productIdToTier } = await import("./whop");
    expect(productIdToTier("")).toBeUndefined();
  });
});

describe("webhook signature verification", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.WHOP_WEBHOOK_SECRET = SECRET;
    process.env.WHOP_API_KEY = "test_api_key";
  });

  it("unwraps a correctly-signed payload (raw key passthrough works)", async () => {
    const { getWhop } = await import("./whop");
    const payload = JSON.stringify({
      id: "evt_1",
      type: "payment.succeeded",
      data: { id: "pay_1" },
    });
    const event = getWhop().webhooks.unwrap(payload, {
      headers: signedHeaders(payload),
    });
    expect(event.type).toBe("payment.succeeded");
  });

  it("rejects a tampered payload", async () => {
    const { getWhop } = await import("./whop");
    const payload = JSON.stringify({
      id: "evt_1",
      type: "payment.succeeded",
      data: {},
    });
    const headers = signedHeaders(payload);
    const tampered = payload.replace("payment.succeeded", "membership.activated");
    expect(() =>
      getWhop().webhooks.unwrap(tampered, { headers }),
    ).toThrow();
  });
});