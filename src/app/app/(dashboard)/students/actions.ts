"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const StudentSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  class_id: z.string().uuid().nullish().or(z.literal("")),
  dob: z.string().nullish().or(z.literal("")),
  gender: z.string().nullish().or(z.literal("")),
  enrollment_date: z.string().min(1, "Enrollment date is required"),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

function normalize(formData: FormData) {
  return {
    first_name: String(formData.get("first_name") ?? ""),
    last_name: String(formData.get("last_name") ?? ""),
    class_id: String(formData.get("class_id") ?? "") || null,
    dob: String(formData.get("dob") ?? "") || null,
    gender: String(formData.get("gender") ?? "") || null,
    enrollment_date:
      String(formData.get("enrollment_date") ?? "") ||
      new Date().toISOString().slice(0, 10),
  };
}

export async function createStudent(formData: FormData): Promise<ActionResult> {
  const parsed = StudentSchema.safeParse(normalize(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.user.id)
    .maybeSingle();
  if (!profile?.school_id) return { ok: false, error: "No school assigned" };

  const { error } = await supabase.from("students").insert({
    school_id: profile.school_id,
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    class_id: parsed.data.class_id || null,
    dob: parsed.data.dob || null,
    gender: parsed.data.gender || null,
    enrollment_date: parsed.data.enrollment_date,
    status: "active",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/students");
  return { ok: true };
}

export async function updateStudent(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = StudentSchema.safeParse(normalize(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      class_id: parsed.data.class_id || null,
      dob: parsed.data.dob || null,
      gender: parsed.data.gender || null,
      enrollment_date: parsed.data.enrollment_date,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/students");
  return { ok: true };
}

export async function setStudentStatus(
  id: string,
  status: "active" | "withdrawn",
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/students");
  return { ok: true };
}

/** Tiny CSV parser — handles quoted values and commas. No deps. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\r") {
        // skip
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const MAX_CSV_BYTES = 5_000_000; // 5 MB hard cap
const MAX_CSV_ROWS = 5000; // including header

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_GENDERS = new Set(["male", "female", "other"]);

/** Validate a yyyy-mm-dd string. Returns the string if valid, else null. */
function parseIsoDate(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (!ISO_DATE.test(v)) return null;
  const d = new Date(v + "T00:00:00Z");
  if (isNaN(d.getTime())) return null;
  return v;
}

export async function importStudentsCsv(
  formData: FormData,
): Promise<ActionResult & { count?: number }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file uploaded" };
  }
  if (file.size > MAX_CSV_BYTES) {
    return {
      ok: false,
      error: `CSV is too large (${Math.round(file.size / 1024)} KB). Maximum is ${Math.round(MAX_CSV_BYTES / 1024)} KB.`,
    };
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { ok: false, error: "CSV is empty or missing rows" };
  }
  if (rows.length > MAX_CSV_ROWS) {
    return {
      ok: false,
      error: `CSV has ${rows.length} rows; maximum is ${MAX_CSV_ROWS}. Split into smaller files.`,
    };
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const requiredHeaders = ["first_name", "last_name"];
  for (const h of requiredHeaders) {
    if (!headers.includes(h)) {
      return {
        ok: false,
        error: `CSV missing required column: ${h}. Expected headers include: first_name, last_name, class, dob, gender, enrollment_date.`,
      };
    }
  }

  const idx = (col: string) => headers.indexOf(col);

  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false, error: "Not authenticated" };
  const { data: profile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.user.id)
    .maybeSingle();
  if (!profile?.school_id) return { ok: false, error: "No school assigned" };

  const { data: classes } = await supabase.from("classes").select("id, name");
  const classMap = new Map<string, string>();
  for (const c of (classes ?? []) as Array<{ id: string; name: string }>) {
    classMap.set(c.name.trim().toLowerCase(), c.id);
  }

  const today = new Date().toISOString().slice(0, 10);
  const inserts: Record<string, unknown>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const first = r[idx("first_name")]?.trim();
    const last = r[idx("last_name")]?.trim();
    if (!first || !last) continue;

    const className = idx("class") >= 0 ? r[idx("class")]?.trim() : "";
    const dobRaw = idx("dob") >= 0 ? r[idx("dob")]?.trim() : "";
    const enrollRaw =
      idx("enrollment_date") >= 0
        ? r[idx("enrollment_date")]?.trim()
        : "";
    const genderRaw =
      idx("gender") >= 0 ? r[idx("gender")]?.trim().toLowerCase() : "";

    const dob = dobRaw ? parseIsoDate(dobRaw) : null;
    if (dobRaw && !dob) {
      errors.push(
        `Row ${i + 1}: DOB "${dobRaw}" is not a valid YYYY-MM-DD date.`,
      );
      continue;
    }

    const enroll = enrollRaw ? parseIsoDate(enrollRaw) : today;
    if (enrollRaw && !enroll) {
      errors.push(
        `Row ${i + 1}: Enrollment date "${enrollRaw}" is not a valid YYYY-MM-DD date.`,
      );
      continue;
    }

    let gender: string | null = null;
    if (genderRaw) {
      if (!ALLOWED_GENDERS.has(genderRaw)) {
        errors.push(
          `Row ${i + 1}: Gender "${genderRaw}" must be male, female, or other.`,
        );
        continue;
      }
      gender = genderRaw;
    }

    inserts.push({
      school_id: profile.school_id,
      first_name: first,
      last_name: last,
      class_id: className ? classMap.get(className.toLowerCase()) ?? null : null,
      dob,
      gender,
      enrollment_date: enroll ?? today,
      status: "active",
    });
  }

  if (errors.length > 0) {
    // Fail loudly with the first few errors so the user can fix the file.
    return {
      ok: false,
      error: `${errors.length} row(s) had errors. First: ${errors.slice(0, 3).join(" ")}`,
    };
  }

  if (inserts.length === 0) {
    return { ok: false, error: "No valid rows found in CSV" };
  }

  const { error } = await supabase.from("students").insert(inserts);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/students");
  return { ok: true, count: inserts.length };
}
