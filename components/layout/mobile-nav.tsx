"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, Building2, LayoutDashboard, Users, Clock, Calendar, DollarSign, Target, Briefcase, FileText, Settings, LogOut, Bell, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/employees", icon: Users, label: "Employees" },
  { href: "/attendance", icon: Clock, label: "Attendance" },
  { href: "/leaves", icon: Calendar, label: "Leaves" },
  { href: "/payroll", icon: DollarSign, label: "Payroll" },
  { href: "/performance", icon: Target, label: "Performance" },
  { href: "/recruitment", icon: Briefcase, label: "Recruitment" },
  { href: "/documents", icon: FileText, label: "Documents" },
  { href: "/announcements", icon: Bell, label: "Announcements" },
  { href: "/reports", icon: FileSearch, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function MobileNav({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div className="md:hidden flex items-center justify-between h-14 px-4 bg-gray-900 text-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">WorkNest</span>
        </div>
        <button onClick={() => setOpen(true)} className="p-1">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-gray-900 text-white flex flex-col">
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-800">
              <span className="font-bold">{userName}</span>
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                      isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-gray-800 p-4">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 w-full px-3 py-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
