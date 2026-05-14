import { createClient } from "@/lib/supabase/server";
import { SectionCard } from "@/components/section-card";
import { SchoolInfoForm } from "./school-info-form";
import { FeeItemsSection } from "./fee-items-section";
import { GenerateInvoicesButton } from "./generate-invoices-button";

export const metadata = { title: "Settings — SchoolPurse" };

export default async function SettingsPage() {
  const supabase = await createClient();

  const [schoolRes, feeItemsRes, classesRes, termRes] = await Promise.all([
    supabase
      .from("schools")
      .select("name, address, phone, currency, receipt_prefix, terms_per_year")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("fee_items")
      .select(
        "id, name, type, amount_usd, recurrence, applicable_class_ids, active, include_on_registration",
      )
      .order("active", { ascending: false })
      .order("name"),
    supabase.from("classes").select("id, name").order("name"),
    supabase
      .from("terms")
      .select("name, start_date, end_date")
      .eq("is_current", true)
      .limit(1)
      .maybeSingle(),
  ]);

  const school = (schoolRes.data ?? {
    name: "",
    address: null,
    phone: null,
    currency: "USD",
    receipt_prefix: "SP",
    terms_per_year: 3,
  }) as {
    name: string;
    address: string | null;
    phone: string | null;
    currency: string;
    receipt_prefix: string;
    terms_per_year: number;
  };

  const feeItems = (feeItemsRes.data ?? []).map((f: Record<string, unknown>) => ({
    id: f.id as string,
    name: f.name as string,
    type: f.type as string,
    amount_usd: Number(f.amount_usd),
    recurrence: f.recurrence as "per_term" | "per_month" | "one_off",
    applicable_class_ids: (f.applicable_class_ids as string[]) ?? [],
    active: f.active as boolean,
    include_on_registration: f.include_on_registration as boolean,
  }));

  const classes = (classesRes.data ?? []) as { id: string; name: string }[];
  const term = termRes.data as
    | { name: string; start_date: string; end_date: string }
    | null;

  return (
    <div className="space-y-6">
      <SectionCard
        title="School information"
        subtitle="Visible on receipts, statements, and reports."
      >
        <SchoolInfoForm school={school} />
      </SectionCard>

      <SectionCard bodyClassName="p-0">
        <FeeItemsSection feeItems={feeItems} classes={classes} />
      </SectionCard>

      <SectionCard
        title="Term operations"
        subtitle={
          term
            ? `Current term: ${term.name} (${term.start_date} → ${term.end_date})`
            : "No current term is set. Create one in your database before generating invoices."
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm text-muted-foreground">
            Generate term invoices for every active student based on the
            active per-term fee items applicable to their class. Students who
            already have an invoice for this term are skipped.
          </p>
          <GenerateInvoicesButton />
        </div>
      </SectionCard>
    </div>
  );
}
