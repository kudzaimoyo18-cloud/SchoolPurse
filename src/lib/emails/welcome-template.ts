/**
 * Pure, dependency-free builder for the SchoolPurse welcome email.
 * No "server-only" and no secrets here so it can be unit-tested and rendered
 * from scripts. The actual send lives in ./welcome.ts.
 */
export type Tier = "free" | "starter" | "standard" | "plus";

const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  starter: "Starter",
  standard: "Standard",
  plus: "Plus",
};

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
    "https://schoolpurse.app"
  );
}

export function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildWelcomeEmailHtml({
  recipientName,
  schoolName,
  tier,
}: {
  recipientName: string;
  schoolName: string;
  tier?: Tier;
}): string {
  const base = appUrl();
  const dashboardUrl = `${base}/app/overview`;
  const planLine = tier
    ? `<p style="margin:0 0 16px;">Your <strong>${esc(TIER_LABEL[tier])}</strong> plan is active. Here&rsquo;s what to do first:</p>`
    : `<p style="margin:0 0 16px;">Your account is ready. Here&rsquo;s what to do first:</p>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="padding:24px 28px;border-bottom:3px solid #1e3a5f;">
      <img src="${base}/logo.png" alt="SchoolPurse" width="140" style="margin-bottom:16px;"/>
      <h1 style="margin:0;font-size:20px;color:#18181b;">Welcome aboard, ${esc(recipientName)} &#127881;</h1>
    </div>
    <div style="padding:24px 28px;font-size:15px;line-height:1.6;color:#3f3f46;">
      <p style="margin:0 0 16px;">
        <strong>${esc(schoolName)}</strong> is now set up on SchoolPurse &mdash;
        your school&rsquo;s home for fees, payments, receipts and arrears.
      </p>
      ${planLine}
      <ol style="margin:0 0 20px;padding-left:20px;color:#3f3f46;">
        <li style="margin-bottom:6px;">Add your <strong>classes</strong> and <strong>fee items</strong> in Settings.</li>
        <li style="margin-bottom:6px;">Import or add your <strong>students</strong>.</li>
        <li style="margin-bottom:6px;">Record your <strong>first payment</strong> and print a receipt.</li>
      </ol>
      <a href="${esc(dashboardUrl)}"
         style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Open my dashboard
      </a>
      <p style="margin:20px 0 0;font-size:13px;color:#71717a;">
        Need a hand getting started? Just reply to this email &mdash; a real person reads it.
      </p>
      <p style="margin:16px 0 0;color:#71717a;font-size:13px;">
        &mdash; The SchoolPurse Team
      </p>
    </div>
    <div style="padding:16px 28px;background:#fafafa;font-size:11px;color:#a1a1aa;text-align:center;">
      You&rsquo;re receiving this because you created ${esc(schoolName)} on SchoolPurse.
    </div>
  </div>
</body>
</html>`.trim();
}
