import {
  Home,
  CreditCard,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Show a count badge — e.g. arrears count. */
  badge?: "arrears";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/app/overview", label: "Overview", icon: Home },
  { href: "/app/payments", label: "Payments", icon: CreditCard },
  { href: "/app/arrears", label: "Arrears", icon: AlertTriangle, badge: "arrears" },
  { href: "/app/students", label: "Students", icon: Users },
  { href: "/app/expenses", label: "Expenses", icon: FileText },
  { href: "/app/reports", label: "Reports & P&L", icon: BarChart3 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];
