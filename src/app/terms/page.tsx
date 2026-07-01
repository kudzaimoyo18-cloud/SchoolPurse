import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LegalShell } from "@/components/marketing/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service — SchoolPurse",
  description:
    "The terms that govern use of SchoolPurse — accounts, acceptable use, billing, liability and governing law (Zimbabwe).",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <LegalShell
      isAuthed={!!user}
      title="Terms of Service"
      intro={`These terms are a contract between your school and ${LEGAL.service}, operated by ${LEGAL.operatorLegalName} (${LEGAL.location}). By creating an account or using ${LEGAL.service}, you agree to them.`}
    >
      <h2>1. What SchoolPurse is</h2>
      <p>
        {LEGAL.service} is internal school-finance software: it helps school
        staff invoice term fees, record payments (cash, bank transfer, mobile
        money), issue receipts, and track arrears and expenses. It is a{" "}
        <strong>record-keeping tool, not a payment gateway</strong> — parents
        pay the school the way they always have; you record what came in.{" "}
        {LEGAL.service} does not hold, move or process any funds.
      </p>

      <h2>2. Accounts &amp; eligibility</h2>
      <ul>
        <li>
          Accounts are for authorised school staff only (head/admin, bursar,
          teacher). Students and parents do not get logins.
        </li>
        <li>
          You are responsible for keeping sign-in credentials secure and for all
          activity under your school&apos;s accounts, including the teammates you
          invite.
        </li>
        <li>
          You must provide accurate information and have the authority to act for
          your school.
        </li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use {LEGAL.service} for anything unlawful or fraudulent.</li>
        <li>
          Upload data you have no right to hold, or lack a lawful basis to
          process (see your responsibilities in the{" "}
          <a href="/privacy">Privacy Policy</a> and <a href="/dpa">DPA</a>).
        </li>
        <li>
          Attempt to breach security, access another school&apos;s data, or
          disrupt the service.
        </li>
        <li>Resell or sublicense the service without our written agreement.</li>
      </ul>

      <h2>4. Plans, billing &amp; payment</h2>
      <ul>
        <li>
          Paid plans (Starter, Pro) are billed monthly in USD through our
          payments partner, <strong>Whop</strong>. The AI plan is custom-priced.
        </li>
        <li>
          Subscriptions renew automatically each month until cancelled. You can
          cancel at any time; access continues to the end of the paid period.
        </li>
        <li>
          Fees are generally non-refundable except where required by law. If you
          believe you were billed in error, contact us and we will work it out
          in good faith.
        </li>
        <li>
          Plan limits (e.g. student and staff counts) apply as shown on the
          pricing page. We will give reasonable notice of any price change.
        </li>
      </ul>

      <h2>5. Your data</h2>
      <p>
        Your school&apos;s data remains yours. We process it only to provide the
        service, as described in the <a href="/privacy">Privacy Policy</a> and{" "}
        <a href="/dpa">Data Processing Agreement</a>. You are responsible for the
        accuracy of what you enter and for having the right to hold it —
        including any parental consent for student records.
      </p>

      <h2>6. Availability &amp; &quot;as is&quot;</h2>
      <p>
        We work hard to keep {LEGAL.service} available and correct, but it is
        provided <strong>&quot;as is&quot; without warranties</strong> of any
        kind. We do not guarantee uninterrupted or error-free operation.{" "}
        {LEGAL.service} is a tool to support your bookkeeping; it does not replace
        professional accounting or audit, and you remain responsible for your
        school&apos;s financial records.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {LEGAL.service} and its operator
        are not liable for indirect, incidental or consequential losses, or for
        lost data, revenue or profits. Our total liability for any claim
        relating to the service is limited to the fees you paid in the three
        months before the claim.
      </p>

      <h2>8. Suspension &amp; termination</h2>
      <p>
        You may stop using {LEGAL.service} at any time. We may suspend or
        terminate access for non-payment or breach of these terms, giving
        reasonable notice where practical. On termination we return or delete
        your data on request, subject to legal retention periods (see the
        Privacy Policy).
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these terms or the service. For material changes we will
        update the date above and notify schools by email. Continued use after a
        change means you accept the updated terms.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of Zimbabwe, and disputes are
        subject to the jurisdiction of the Zimbabwean courts. Data protection is
        governed by the {LEGAL.law}.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these terms: email{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    </LegalShell>
  );
}
