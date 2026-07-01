import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LegalShell } from "@/components/marketing/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — SchoolPurse",
  description:
    "How SchoolPurse collects, uses, stores and protects personal data, and your rights under Zimbabwe's Cyber and Data Protection Act.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <LegalShell
      isAuthed={!!user}
      title="Privacy Policy"
      intro={`This policy explains how ${LEGAL.service} handles personal data. It is written to align with the ${LEGAL.law}. ${LEGAL.service} is operated by ${LEGAL.operatorLegalName}, based in ${LEGAL.location}.`}
    >
      <h2>1. Two roles, and who is responsible</h2>
      <p>
        <strong>Your school&apos;s data (students, guardians, payments).</strong>{" "}
        When a school uses {LEGAL.service} to record its students, guardians,
        invoices and payments, the <strong>school is the data controller</strong>{" "}
        — it decides what data to hold and why. {LEGAL.service} is the{" "}
        <strong>data processor</strong>: we only process that data on the
        school&apos;s instructions to provide the service. How we do that is set
        out in our <a href="/dpa">Data Processing Agreement</a>.
      </p>
      <p>
        <strong>Staff account data.</strong> For the accounts of the school
        staff who sign in (name, email, role), {LEGAL.service} acts as the
        controller, and this Privacy Policy governs that data.
      </p>

      <h2>2. What we collect</h2>
      <h3>Staff accounts</h3>
      <ul>
        <li>Name, email address and assigned role (head, bursar, teacher).</li>
        <li>
          Authentication data and sign-in activity (handled by our auth
          provider).
        </li>
        <li>
          Basic product-usage analytics — only if you consent to analytics
          cookies (see section 9).
        </li>
      </ul>
      <h3>School records (processed for the school)</h3>
      <ul>
        <li>
          Students: names, dates of birth, gender, class, enrolment dates and
          optional photographs.
        </li>
        <li>
          Guardians / parents: names, phone numbers, email addresses and home
          addresses.
        </li>
        <li>
          Finance: invoices, fee items, payments (cash, bank transfer, mobile
          money), receipts, arrears and expenses.
        </li>
      </ul>

      <h2>3. How we use data</h2>
      <ul>
        <li>To provide, secure and support the {LEGAL.service} service.</li>
        <li>
          To let bursars and heads invoice fees, record payments, issue
          receipts and track arrears.
        </li>
        <li>To send transactional emails (invites, receipts, notices).</li>
        <li>
          On the AI plan only, and where enabled: to power the AI finance
          assistant and send WhatsApp fee reminders.
        </li>
        <li>To meet legal and accounting obligations.</li>
      </ul>
      <p>
        We do <strong>not</strong> sell personal data, and we do not use school
        records for advertising.
      </p>

      <h2>4. Legal basis</h2>
      <p>
        We process personal data under the {LEGAL.law}: to perform our contract
        with the school, to meet legal obligations, for our legitimate interest
        in operating and securing the service, and — for analytics cookies —
        with your consent. Schools are responsible for obtaining any parental
        consent required for the student data they enter.
      </p>

      <h2>5. Where your data is stored (international transfer)</h2>
      <p>
        Personal data in {LEGAL.service} is stored in{" "}
        <strong>{LEGAL.dataRegion}</strong>, and some sub-processors operate in
        the United States or the EU (see section 7). This means data may be
        transferred outside Zimbabwe. We rely on contractual safeguards with our
        providers and take reasonable steps to ensure a comparable level of
        protection, consistent with the {LEGAL.law}.
      </p>

      <h2>6. How long we keep it</h2>
      <p>
        We keep school records for as long as the school has an active account,
        plus a reasonable period afterwards for backups, dispute resolution and
        legal/accounting requirements. Voided receipts are never hard-deleted so
        the audit trail stays intact. When a school closes its account, we
        return or delete its data on request, subject to legal retention
        periods.
      </p>

      <h2>7. Who we share data with (sub-processors)</h2>
      <p>
        We use a small set of trusted providers to run the service. They may
        only process data to provide their service to us. The current list is in
        the <a href="/dpa">Data Processing Agreement</a>, and includes our
        database/hosting, email, billing, analytics and (on the AI plan) AI and
        messaging providers. We otherwise disclose data only where required by
        law.
      </p>

      <h2>8. Security</h2>
      <ul>
        <li>All traffic is encrypted in transit (HTTPS).</li>
        <li>
          Each school&apos;s data is isolated using database row-level security,
          so one school can never see another&apos;s.
        </li>
        <li>
          Access is role-based — a teacher sees students but not finance; only
          the head/admin can change settings or correct income.
        </li>
        <li>Student photos are served via short-lived signed links only.</li>
      </ul>

      <h2>9. Cookies &amp; analytics</h2>
      <p>
        We use a strictly-necessary cookie to keep you signed in. We also use{" "}
        <strong>PostHog</strong> for product analytics — but only if you accept
        analytics cookies in the consent banner. You can decline, and you can
        change your mind at any time; declining does not affect your ability to
        use {LEGAL.service}.
      </p>

      <h2>10. Your rights</h2>
      <p>
        Under the {LEGAL.law} you may request access to your personal data, ask
        us to correct or delete it, or object to certain processing. For student
        or guardian records, contact the school (the controller) first; we will
        support the school in responding. To exercise any right, email{" "}
        <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>.
      </p>

      <h2>11. Children&apos;s data</h2>
      <p>
        {LEGAL.service} holds data about children because schools record their
        students. Students and parents do not have logins — only school staff
        do. Schools are responsible for the lawful basis (including any parental
        consent) for the student data they enter, and we process it strictly on
        their instructions with the safeguards above.
      </p>

      <h2>12. Breach notification</h2>
      <p>
        If a personal-data breach occurs that is likely to affect you or a
        school&apos;s data, we will notify the affected school(s) and, where
        required, {LEGAL.regulator}, without undue delay.
      </p>

      <h2>13. Changes</h2>
      <p>
        We may update this policy; we will change the &quot;last updated&quot;
        date above and, for material changes, notify schools by email.
      </p>

      <h2>14. Contact &amp; complaints</h2>
      <p>
        Questions or complaints: email{" "}
        <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>. You
        also have the right to lodge a complaint with {LEGAL.regulator}.
      </p>
    </LegalShell>
  );
}
