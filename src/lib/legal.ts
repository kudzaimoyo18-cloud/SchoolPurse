// =============================================================================
// Legal constants — the ONLY place to edit the fill-in-later details that the
// Privacy Policy, Terms of Service and DPA all reference.
//
// ⚠️  BEFORE PUBLISHING (do not skip):
//   1. Replace OPERATOR_LEGAL_NAME with your registered entity — or, until you
//      incorporate, your full legal name as sole operator. It renders on every
//      legal page, so a placeholder is deliberately obvious.
//   2. Confirm the contact + DPO email inboxes below actually exist.
//   3. Have a Zimbabwean data-protection lawyer review all three documents.
//      These are informational drafts, NOT legal advice.
// =============================================================================

export const LEGAL = {
  /** Product / service name shown throughout. */
  service: "SchoolPurse",
  /**
   * The responsible party named in the documents. You are currently a sole
   * operator (no registered company yet) — put your full legal name here.
   * Registering a company before scaling is strongly recommended.
   */
  operatorLegalName: "Kudzie Moyo",
  location: "Harare, Zimbabwe",

  /** Contact inboxes — verify these exist before publishing. */
  contactEmail: "support@schoolpurse.app",
  // Pointed at support@ (which exists) rather than a privacy@ inbox that may not
  // yet be set up, so data-protection requests don't bounce. Create privacy@ and
  // change this one line when ready.
  privacyEmail: "support@schoolpurse.app",

  /** Governing law + regulator (Zimbabwe). */
  law: "Cyber and Data Protection Act [Chapter 12:07] of Zimbabwe",
  regulator:
    "POTRAZ — the Postal and Telecommunications Regulatory Authority of Zimbabwe (Zimbabwe's Data Protection Authority)",

  /** Where personal data is physically stored (drives the cross-border note). */
  dataRegion: "London, United Kingdom (Supabase, eu-west-2)",

  /** Bump when you materially change any policy. */
  lastUpdated: "1 July 2026",
} as const;

/**
 * Third parties that process personal data on SchoolPurse's behalf
 * (sub-processors). Keep this list current — adding a new vendor that touches
 * personal data means adding a row here and notifying schools per the DPA.
 */
export const SUBPROCESSORS: Array<{
  name: string;
  purpose: string;
  location: string;
}> = [
  {
    name: "Supabase",
    purpose: "Primary database, authentication & file storage (all app data)",
    location: "United Kingdom (eu-west-2)",
  },
  {
    name: "Vercel",
    purpose: "Application hosting & content delivery",
    location: "United Kingdom (lhr1) / global edge",
  },
  {
    name: "Resend",
    purpose: "Transactional email (invites, welcome, announcements)",
    location: "United States / EU",
  },
  {
    name: "PostHog",
    purpose: "Product analytics (usage; only with your cookie consent)",
    location: "United States (US cloud)",
  },
  {
    name: "Whop",
    purpose: "Subscription billing & checkout",
    location: "United States",
  },
  {
    name: "Anthropic",
    purpose: "AI finance assistant (AI plan only; queries are not used to train models)",
    location: "United States",
  },
  {
    name: "Meta / Twilio",
    purpose: "WhatsApp fee reminders (AI plan only, if enabled)",
    location: "United States / global",
  },
  {
    name: "Jitsi (8x8)",
    purpose: "Live video classrooms (AI plan only, if used)",
    location: "United States / EU",
  },
];
