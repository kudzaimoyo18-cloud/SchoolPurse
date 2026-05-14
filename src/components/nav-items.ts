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
  { href: "/overview", label: "Overview", icon: Home },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/arrears", label: "Arrears", icon: AlertTriangle, badge: "arrears" },
  { href: "/students", label: "Students", icon: Users },
  { href: "/expenses", label: "Expenses", icon: FileText },
  { href: "/reports", label: "Reports & P&L", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];
