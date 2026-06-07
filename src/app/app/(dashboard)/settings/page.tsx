import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/current-user";
import { getLogoUrl } from "@/lib/storage";
import { SectionCard } from "@/components/section-card";
import { SchoolInfoForm } from "./school-info-form";
import { FeeItemsSection } from "./fee-items-section";
import { UniformsSection } from "./uniforms-section";
import { GenerateInvoicesButton } from "./generate-invoices-button";
import { TeamSection } from "./team-section";
import { LogoSection } from "./logo-section";
import { SchoolLevelsSection, type Level } from "./school-levels-section";
import { ClassesSection } from "./classes-section";
import { AnnouncementsSection } from "./announcements-section";

export const metadata = { title: "Settings — SchoolPurse" };

export default async function SettingsPage() {
  // Admins only — bursars/teachers must not see team emails or school config.
  const me = await requireRole(["school_admin", "platform_admin"]);
  const supabase = await createClient();
  const admin = createAdminClient();

  const [schoolRes, feeItemsRes, classesRes, termRes, teammatesRes, announcementsRes] =
    await Promise.all([
      supabase
        .from("schools")
        .select("name, address, phone, currency, receipt_prefix, terms_per_year, logo_path, levels")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("fee_items")
        .select(
          "id, name, type, amount_usd, recurrence, applicable_class_ids, active, include_on_registration",
        )
        .order("active", { ascending: false })
        .order("name"),
      supabase.from("classes").select("id, name, level").order("name"),
      supabase
        .from("terms")
        .select("name, start_date, end_date")
        .eq("is_current", true)
        .limit(1)
        .maybeSingle(),
      // Service-role read of teammates so we always see every row on the
      // school, regardless of RLS policies that might restrict cross-row
      // user reads to platform_admin only.
      me.schoolId
        ? admin
            .from("users")
            .select("id, name, email, role, status")
            .eq("school_id", me.schoolId)
            .order("name")
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      // Announcements — only platform_admin sees this section, but fetch
      // unconditionally; the data is small and RLS allows read for all.
      me.role === "platform_admin"
        ? admin
            .from("announcements")
            .select("id, title, body, type, active, email_sent, created_at")
            .order("created_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    ]);

  const school = (schoolRes.data ?? {
    name: "",
    address: null,
    phone: null,
    currency: "USD",
    receipt_prefix: "SP",
    terms_per_year: 3,
    logo_path: null,
    levels: ["primary"],
  }) as {
    name: string;
    address: string | null;
    phone: string | null;
    currency: string;
    receipt_prefix: string;
    terms_per_year: number;
    logo_path: string | null;
    levels: Level[];
  };

  const logoUrl = await getLogoUrl(school.logo_path);

  const allFeeItems = (feeItemsRes.data ?? []).map((f: Record<string, unknown>) => ({
    id: f.id as string,
    name: f.name as string,
    type: f.type as string,
    amount_usd: Number(f.amount_usd),
    recurrence: f.recurrence as "per_term" | "per_month" | "one_off",
    applicable_class_ids: (f.applicable_class_ids as string[]) ?? [],
    active: f.active as boolean,
    include_on_registration: f.include_on_registration as boolean,
  }));

  const feeItems = allFeeItems.filter((f) => f.type !== "uniform");
  const uniformItems = allFeeItems.filter((f) => f.type === "uniform");

  const classes = (classesRes.data ?? []) as {
    id: string;
    name: string;
    level: Level;
  }[];
  const term = termRes.data as
    | { name: string; start_date: string; end_date: string }
    | null;

  const teammates = ((teammatesRes.data ?? []) as Record<string, unknown>[]).map(
    (t) => ({
      id: t.id as string,
      name: t.name as string,
      email: t.email as string,
      role: t.role as "platform_admin" | "school_admin" | "bursar" | "teacher",
      status: (t.status as string) ?? "active",
    }),
  );

  const announcements = ((announcementsRes.data ?? []) as Record<string, unknown>[]).map(
    (a) => ({
      id: a.id as string,
      title: a.title as string,
      body: (a.body as string) ?? "",
      type: a.type as string,
      active: a.active as boolean,
      email_sent: a.email_sent as boolean,
      created_at: a.created_at as string,
    }),
  );

  return (
    <div className="space-y-6">
      <SectionCard
        title="Branding"
        subtitle="Your school logo appears on receipts, invoices, and the sidebar."
      >
        <LogoSection logoUrl={logoUrl} />
      </SectionCard>

      <SectionCard
        title="School information"
        subtitle="Visible on receipts, statements, and reports."
      >
        <SchoolInfoForm school={school} />
      </SectionCard>

      <SectionCard
        title="School levels"
        subtitle="Which sections does your school run? Toggling a level on auto-seeds its standard class list (you can rename or remove afterwards)."
      >
        <SchoolLevelsSection enabledLevels={school.levels} />
      </SectionCard>

      <SectionCard bodyClassName="p-0">
        <ClassesSection classes={classes} enabledLevels={school.levels} />
      </SectionCard>

      <SectionCard bodyClassName="p-0">
        <FeeItemsSection feeItems={feeItems} classes={classes} />
      </SectionCard>

      <SectionCard bodyClassName="p-0">
        <UniformsSection uniforms={uniformItems} classes={classes} />
      </SectionCard>

      <SectionCard bodyClassName="p-0">
        <TeamSection teammates={teammates} currentUserId={me.id} />
      </SectionCard>

      {me.role === "platform_admin" && (
        <SectionCard bodyClassName="p-0">
          <AnnouncementsSection announcements={announcements} />
        </SectionCard>
      )}

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
