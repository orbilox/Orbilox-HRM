"use client";

import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
import { nameInitials } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":    "Dashboard",
  "/employees":    "Employees",
  "/attendance":   "Attendance",
  "/leaves":       "Leaves",
  "/payroll":      "Payroll",
  "/performance":  "Performance",
  "/recruitment":  "Recruitment",
  "/documents":    "Documents",
  "/announcements":"Announcements",
  "/chat":         "Team Chat",
  "/kyc":          "My KYC",
  "/reports":      "Reports",
  "/settings":     "Settings",
};

interface Props {
  userName: string;
  userRole: string;
}

export default function MobileHeader({ userName, userRole }: Props) {
  const pathname = usePathname();

  // Resolve current page title
  const title =
    Object.entries(PAGE_TITLES).find(([key]) =>
      pathname === key || pathname.startsWith(key + "/")
    )?.[1] ?? "Orbilox";

  const parts = userName.trim().split(" ").filter(Boolean);
  const avatarInitials =
    parts.length >= 2
      ? nameInitials(parts[0], parts[parts.length - 1])
      : (parts[0]?.[0] ?? "?").toUpperCase();

  const roleColor: Record<string, string> = {
    ADMIN:    "bg-red-600",
    HR:       "bg-orange-500",
    MANAGER:  "bg-blue-600",
    EMPLOYEE: "bg-purple-600",
  };
  const avatarBg = roleColor[userRole] ?? "bg-purple-600";

  // Chat has its own full header (room name + back button) — hide layout header there
  if (pathname.startsWith("/chat")) return null;

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* User DP */}
        <div
          className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-white text-sm font-bold shrink-0`}
          title={userName}
        >
          {avatarInitials}
        </div>

        {/* Page title / search */}
        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2 min-w-0">
          <span className="text-gray-800 text-sm font-semibold truncate">{title}</span>
        </div>

        {/* App logo */}
        <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  );
}
