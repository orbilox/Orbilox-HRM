"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Calendar, Target, Landmark,
  FileText, MessageSquare, ShieldCheck, Bell,
  Users, Clock, DollarSign, Briefcase, FileSearch, Settings, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const employeeTabs = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Home" },
  { href: "/attendance",    icon: Clock,           label: "Attendance" },
  { href: "/leaves",        icon: Calendar,        label: "Leaves" },
  { href: "/performance",   icon: Target,          label: "Performance" },
  { href: "/payroll",       icon: Landmark,        label: "My Pay" },
  { href: "/documents",     icon: FileText,        label: "Documents" },
  { href: "/chat",          icon: MessageSquare,   label: "Chat" },
  { href: "/kyc",           icon: ShieldCheck,     label: "My KYC" },
  { href: "/announcements", icon: Bell,            label: "Engage" },
];

const adminTabs = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Home" },
  { href: "/employees",     icon: Users,           label: "Employees" },
  { href: "/attendance",    icon: Clock,           label: "Attendance" },
  { href: "/leaves",        icon: Calendar,        label: "Leaves" },
  { href: "/payroll",       icon: DollarSign,      label: "Payroll" },
  { href: "/performance",   icon: Target,          label: "Performance" },
  { href: "/recruitment",   icon: Briefcase,       label: "Jobs" },
  { href: "/documents",     icon: FileText,        label: "Docs" },
  { href: "/announcements", icon: Bell,            label: "Announce" },
  { href: "/chat",          icon: MessageSquare,   label: "Chat" },
  { href: "/kyc",           icon: ShieldCheck,     label: "KYC" },
  { href: "/reports",       icon: FileSearch,      label: "Reports" },
  { href: "/settings",      icon: Settings,        label: "Settings" },
];

export default function MobileNav({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const isAdmin = userRole === "ADMIN" || userRole === "HR" || userRole === "MANAGER";
  const tabs = isAdmin ? adminTabs : employeeTabs;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Scrollable strip — pan-x keeps vertical scroll fast */}
      <div
        className="flex-1 flex overflow-x-auto scrollbar-hide"
        style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-none flex flex-col items-center justify-center py-2.5 gap-0.5",
                "min-w-[68px] px-1 active:bg-gray-50",
                active ? "text-purple-600" : "text-gray-400"
              )}
              style={{ touchAction: "manipulation" }}
            >
              <tab.icon
                className={cn("w-5 h-5", active && "stroke-[2.5]")}
              />
              <span
                className={cn(
                  "text-[9px] font-semibold tracking-wide text-center leading-tight",
                  active ? "text-purple-600" : "text-gray-400"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Fade hint before sign-out */}
      <div className="pointer-events-none absolute right-[60px] top-0 h-[100%] w-8 bg-gradient-to-l from-white to-transparent" />

      {/* Sign Out — always visible, pinned right */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex-none flex flex-col items-center justify-center py-2.5 gap-0.5 px-3.5 border-l border-gray-100 text-gray-400 active:text-red-500 bg-white"
        style={{ touchAction: "manipulation" }}
      >
        <LogOut className="w-5 h-5" />
        <span className="text-[9px] font-semibold tracking-wide">Logout</span>
      </button>
    </nav>
  );
}
