import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LegalShell } from "@/components/marketing/legal-shell";
import { LEGAL, SUBPROCESSORS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Data Processing Agreement — SchoolPurse",
  description:
    "How SchoolPurse processes school data as a processor on behalf of schools (controllers), including sub-processors and security, under Zimbabwe's Cyber and Data Protection Act.",
  alternates: { canonical: "/dpa" },
};

export default async function DpaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <LegalShell
      isAuthed={!!user}
      title="Data Processing Agreement"
      intro={`This Agreement forms part of the Terms of Service between your school (the "Controller") and ${LEGAL.service}, operated by ${LEGAL.operatorLegalName} (the "Processor"). It describes how we process personal data on your behalf under the ${LEGAL.law}.`}
    >
      <h2>1. Roles</h2>
      <p>
        Your <strong>school is the Controller</strong> of the student, guardian
        and finance data it enters. <strong>{LEGAL.service} is the Processor</strong>,
        acting only on your documented instructions (which include using the
        product&apos;s features). Where anything conflicts with the{" "}
        <a href="/privacy">Privacy Policy</a> on the subject of processing school
        data, this Agreement governs.
      </p>

      <h2>2. Scope of processing</h2>
      <ul>
        <li>
          <strong>Purpose:</strong> to provide school fee-management (invoicing,
          payments, receipts, arrears, expenses, reports) and any features you
          enable.
        </li>
        <li>
          <strong>Duration:</strong> for as long as your account is active, plus
          the retention period in the Privacy Policy.
        </li>
        <li>
          <strong>Data subjects:</strong> your students, their guardians, and
          your staff.
        </li>
        <li>
          <strong>Data types:</strong> names, dates of birth, gender, class,
          contact details, addresses, optional photographs, and financial
          records (invoices, payments, receipts, arrears, expenses).
        </li>
      </ul>

      <h2>3. Our obligations as Processor</h2>
      <ul>
        <li>Process personal data only on your instructions and to provide the service.</li>
        <li>Keep personal data confidential and limit access to those who need it.</li>
        <li>Apply appropriate security measures (section 6).</li>
        <li>Assist you, so far as reasonable, with data-subject requests (section 7).</li>
        <li>Notify you of personal-data breaches without undue delay (section 8).</li>
        <li>Return or delete personal data when the account ends (section 9).</li>
        <li>Not sell personal data or use it for our own advertising.</li>
      </ul>

      <h2>4. Sub-processors</h2>
      <p>
        You authorise {LEGAL.service} to use the sub-processors below to provide
        the service. Each is bound to protect personal data and may use it only
        to provide their service to us. We will give reasonable notice before
        adding or replacing a sub-processor, so you can object.
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-left text-[13.5px]">
          <thead className="bg-sp-card-alt">
            <tr>
              <th className="px-4 py-2.5 font-semibold text-foreground">Provider</th>
              <th className="px-4 py-2.5 font-semibold text-foreground">Purpose</th>
              <th className="px-4 py-2.5 font-semibold text-foreground">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {SUBPROCESSORS.map((s) => (
              <tr key={s.name}>
                <td className="px-4 py-2.5 font-medium text-foreground">{s.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{s.purpose}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{s.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>5. International transfers</h2>
      <p>
        Personal data is stored in <strong>{LEGAL.dataRegion}</strong>, and some
        sub-processors operate in the United States or the EU. Data may therefore
        be transferred outside Zimbabwe. We rely on contractual safeguards with
        these providers to maintain a comparable level of protection, consistent
        with the {LEGAL.law}.
      </p>

      <h2>6. Security measures</h2>
      <ul>
        <li>Encryption of data in transit (HTTPS).</li>
        <li>
          Per-school isolation via database row-level security — one school
          cannot access another&apos;s data.
        </li>
        <li>
          Role-based access control (head/admin, bursar, teacher) enforced on
          both the interface and the database.
        </li>
        <li>Short-lived signed URLs for private files such as student photos.</li>
        <li>Audit trail on financial records; voided receipts are retained, not deleted.</li>
      </ul>

      <h2>7. Data-subject requests</h2>
      <p>
        If a student, guardian or staff member exercises a right (access,
        correction, deletion, objection), and it concerns data we process for
        you, we will assist you in responding within a reasonable time. Requests
        should normally be directed to the school as Controller.
      </p>

      <h2>8. Breach notification</h2>
      <p>
        On becoming aware of a personal-data breach affecting your data, we will
        notify you without undue delay with the information reasonably available,
        so you can meet your own obligations to {LEGAL.regulator} and affected
        individuals.
      </p>

      <h2>9. Return &amp; deletion</h2>
      <p>
        When your account ends, we will, on request, return your data (e.g. via
        CSV export) and delete it from active systems, then from backups within
        our normal backup cycle, subject to any legal retention requirement.
      </p>

      <h2>10. Audit &amp; information</h2>
      <p>
        On reasonable written request, we will provide information necessary to
        demonstrate our compliance with this Agreement.
      </p>

      <h2>11. Governing law</h2>
      <p>
        This Agreement is governed by the laws of Zimbabwe and the {LEGAL.law}.
        To request a countersigned copy for your records, contact{" "}
        <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>.
      </p>
    </LegalShell>
  );
}
