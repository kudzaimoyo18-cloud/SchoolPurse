import "server-only";

// Provider-agnostic WhatsApp sender. The send pipe calls getProvider(); when no
// provider is configured it returns null and messages are stored as "skipped"
// (ready to deliver the moment credentials are added). Two adapters ship here —
// Meta WhatsApp Cloud API and Twilio — selected by WHATSAPP_PROVIDER.
//
// Note: Meta/Twilio both require an approved message template for business-
// initiated (out-of-session) messages. The text send below works inside an open
// 24h customer-service window; wiring templates is a follow-up.

export interface MessagingProvider {
  name: string;
  sendWhatsApp(to: string, body: string): Promise<{ id?: string }>;
}

export function getProvider(): MessagingProvider | null {
  switch (process.env.WHATSAPP_PROVIDER) {
    case "meta":
      return metaProvider();
    case "twilio":
      return twilioProvider();
    default:
      return null;
  }
}

function metaProvider(): MessagingProvider | null {
  const token = process.env.WHATSAPP_META_TOKEN;
  const phoneId = process.env.WHATSAPP_META_PHONE_ID;
  if (!token || !phoneId) return null;

  return {
    name: "meta",
    async sendWhatsApp(to, body) {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: to.replace(/^\+/, ""),
            type: "text",
            text: { body },
          }),
        },
      );
      if (!res.ok) {
        throw new Error(`meta ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
      const json = (await res.json()) as {
        messages?: Array<{ id?: string }>;
      };
      return { id: json.messages?.[0]?.id };
    },
  };
}

function twilioProvider(): MessagingProvider | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. +14155238886
  if (!sid || !auth || !from) return null;

  return {
    name: "twilio",
    async sendWhatsApp(to, body) {
      const params = new URLSearchParams({
        From: `whatsapp:${from}`,
        To: `whatsapp:${to}`,
        Body: body,
      });
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            authorization: `Basic ${Buffer.from(`${sid}:${auth}`).toString("base64")}`,
            "content-type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        },
      );
      if (!res.ok) {
        throw new Error(
          `twilio ${res.status}: ${(await res.text()).slice(0, 200)}`,
        );
      }
      const json = (await res.json()) as { sid?: string };
      return { id: json.sid };
    },
  };
}
