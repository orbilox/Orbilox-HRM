import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userName = session.user.name ?? session.user.email ?? "User";
  const userRole = session.user.role ?? "EMPLOYEE";

  return (
    <div className="flex h-screen lg:h-dvh overflow-hidden bg-gray-50">
      <Sidebar
        userRole={userRole}
        userName={userName}
        userEmail={session.user.email}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile sticky top bar — visible on all pages below lg */}
        <MobileHeader userName={userName} userRole={userRole} />
        {/* Mobile bottom nav */}
        <MobileNav userName={userName} userRole={userRole} />
        <main className="flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain mobile-scroll-padding lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
