import {
  Home,
  CreditCard,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  Users,
  GraduationCap,
  CalendarCheck,
  Video,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/supabase/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Show a count badge — e.g. arrears count. */
  badge?: "arrears";
  /** Roles allowed to see this item. Omit = visible to all roles. */
  roles?: ReadonlyArray<UserRole>;
}

export interface NavSection {
  /** Section heading. Omit for the top, label-less group. */
  label?: string;
  items: NavItem[];
}

const FINANCE: ReadonlyArray<UserRole> = [
  "platform_admin",
  "school_admin",
  "bursar",
];
const ADMIN: ReadonlyArray<UserRole> = ["platform_admin", "school_admin"];
const ACADEMICS: ReadonlyArray<UserRole> = [
  "platform_admin",
  "school_admin",
  "teacher",
];
const STAFF: ReadonlyArray<UserRole> = [
  "platform_admin",
  "school_admin",
  "bursar",
  "teacher",
];

// Grouped navigation — the dashboard is organised into clear sections so the
// sidebar reads as a map of the product, not a long flat list.
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ href: "/app/overview", label: "Overview", icon: Home }],
  },
  {
    label: "Finance",
    items: [
      { href: "/app/payments", label: "Payments", icon: CreditCard, roles: FINANCE },
      {
        href: "/app/arrears",
        label: "Arrears",
        icon: AlertTriangle,
        badge: "arrears",
        roles: FINANCE,
      },
      { href: "/app/expenses", label: "Expenses", icon: FileText, roles: FINANCE },
      {
        href: "/app/reports",
        label: "Reports & P&L",
        icon: BarChart3,
        roles: FINANCE,
      },
    ],
  },
  {
    label: "Academics",
    items: [
      { href: "/app/students", label: "Students", icon: Users },
      {
        href: "/app/attendance",
        label: "Attendance",
        icon: CalendarCheck,
        roles: ACADEMICS,
      },
      {
        href: "/app/report-cards",
        label: "Report Cards",
        icon: GraduationCap,
        roles: ACADEMICS,
      },
      { href: "/app/classroom", label: "Classroom", icon: Video, roles: ACADEMICS },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/app/messages", label: "Messages", icon: MessageSquare, roles: STAFF },
    ],
  },
  {
    items: [
      { href: "/app/settings", label: "Settings", icon: Settings, roles: ADMIN },
    ],
  },
];

/** Flat list of every nav item, across all sections (e.g. for page-title lookup). */
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/** Sections filtered for a role; empty sections are dropped. */
export function navSectionsForRole(role: UserRole): NavSection[] {
  return NAV_SECTIONS.map((s) => ({
    label: s.label,
    items: s.items.filter((i) => !i.roles || i.roles.includes(role)),
  })).filter((s) => s.items.length > 0);
}
