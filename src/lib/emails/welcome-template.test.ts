import { describe, it, expect } from "vitest";
import { buildWelcomeEmailHtml, esc } from "./welcome-template";

describe("buildWelcomeEmailHtml", () => {
  it("includes recipient, school name, and dashboard link", () => {
    const html = buildWelcomeEmailHtml({
      recipientName: "Tendai",
      schoolName: "Twinkle Star Junior School",
      tier: "standard",
    });
    expect(html).toContain("Tendai");
    expect(html).toContain("Twinkle Star Junior School");
    expect(html).toContain("/app/overview");
    expect(html).toContain("Standard"); // tier label
  });

  it("shows a neutral line when no tier is given", () => {
    const html = buildWelcomeEmailHtml({
      recipientName: "A",
      schoolName: "B",
    });
    expect(html).toContain("Your account is ready");
  });

  it("escapes HTML in user-supplied values (no injection)", () => {
    const html = buildWelcomeEmailHtml({
      recipientName: '<script>alert(1)</script>',
      schoolName: 'Acme & "Co" <b>',
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Acme &amp; &quot;Co&quot; &lt;b&gt;");
  });
});

describe("esc", () => {
  it("escapes &, <, >, and double quotes", () => {
    expect(esc('a & b < c > d "e"')).toBe("a &amp; b &lt; c &gt; d &quot;e&quot;");
  });
});
