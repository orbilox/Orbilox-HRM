"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Building2, LayoutDashboard, Users, Clock, Calendar,
  DollarSign, Target, Briefcase, FileText, Settings,
  LogOut, ChevronLeft, Menu, Bell, FileSearch, UserCircle, Landmark, UsersRound, Smile, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// ── Admin nav ─────────────────────────────────────────────────────────────────
const adminNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/employees", icon: Users, label: "Employees" },
  { href: "/attendance", icon: Clock, label: "Attendance" },
  { href: "/leaves", icon: Calendar, label: "Leaves" },
  { href: "/payroll", icon: DollarSign, label: "Payroll" },
  { href: "/performance", icon: Target, label: "Performance" },
  { href: "/recruitment", icon: Briefcase, label: "Recruitment" },
  { href: "/documents", icon: FileText, label: "Documents" },
  { href: "/announcements", icon: Bell, label: "Announcements" },
  { href: "/kyc", icon: ShieldCheck, label: "KYC" },
  { href: "/reports", icon: FileSearch, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

// ── Employee nav (Keka-style: icon + label) ───────────────────────────────────
const employeeNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/attendance", icon: UserCircle, label: "Attendance" },
  { href: "/leaves", icon: Calendar, label: "Leaves" },
  { href: "/performance", icon: Target, label: "Performance" },
  { href: "/payroll", icon: Landmark, label: "My Pay" },
  { href: "/documents", icon: FileText, label: "Documents" },
  { href: "/kyc", icon: ShieldCheck, label: "My KYC" },
  { href: "/announcements", icon: Bell, label: "Engage" },
];

interface SidebarProps {
  userRole: string;
  userName: string;
  userEmail: string;
}

// ── Keka-style narrow sidebar for employees ───────────────────────────────────
function EmployeeSidebar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden md:flex flex-col bg-[#1E1B2E] text-white w-[72px] shrink-0">
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-white/10">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center py-3 gap-1 overflow-y-auto">
        {employeeNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 w-full py-2.5 px-1 transition-all text-center group",
                isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
              )}
              title={item.label}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                isActive ? "bg-purple-600" : "group-hover:bg-white/10"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User avatar + logout */}
      <div className="border-t border-white/10 flex flex-col items-center py-3 gap-2">
        <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold" title={userName}>
          {initials}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-400 transition-colors py-1"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[10px]">Logout</span>
        </button>
      </div>
    </aside>
  );
}

// ── Standard sidebar for admin/HR/manager ─────────────────────────────────────
function AdminSidebar({ userRole, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-gray-900 text-white transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 px-4 border-b border-gray-800", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">WorkNest</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors", collapsed && "hidden")}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="flex justify-center py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={cn("border-t border-gray-800 p-4", collapsed && "px-2")}>
        {!collapsed && (
          <div className="mb-3">
            <div className="text-sm font-medium text-white truncate">{userName}</div>
            <div className="text-xs text-gray-400 truncate">{userEmail}</div>
            <div className="text-xs text-blue-400 mt-0.5 font-medium">{userRole}</div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors w-full rounded-lg px-3 py-2 hover:bg-gray-800",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

// ── Exported component ────────────────────────────────────────────────────────
export default function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const isAdmin = userRole === "ADMIN" || userRole === "HR" || userRole === "MANAGER";
  if (isAdmin) return <AdminSidebar userRole={userRole} userName={userName} userEmail={userEmail} />;
  return <EmployeeSidebar userName={userName} userEmail={userEmail} />;
}
