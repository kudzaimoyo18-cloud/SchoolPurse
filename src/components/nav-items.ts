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

export const NAV_ITEMS: NavItem[] = [
  { href: "/app/overview", label: "Overview", icon: Home },
  { href: "/app/payments", label: "Payments", icon: CreditCard, roles: FINANCE },
  {
    href: "/app/arrears",
    label: "Arrears",
    icon: AlertTriangle,
    badge: "arrears",
    roles: FINANCE,
  },
  { href: "/app/students", label: "Students", icon: Users },
  { href: "/app/expenses", label: "Expenses", icon: FileText, roles: FINANCE },
  { href: "/app/reports", label: "Reports & P&L", icon: BarChart3, roles: FINANCE },
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
  {
    href: "/app/classroom",
    label: "Classroom",
    icon: Video,
    roles: ACADEMICS,
  },
  { href: "/app/settings", label: "Settings", icon: Settings, roles: ADMIN },
];

/** Filter the nav for a given role. */
export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(role));
}
