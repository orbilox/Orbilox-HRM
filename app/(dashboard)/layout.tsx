import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        userRole={session.user.role}
        userName={session.user.name ?? session.user.email}
        userEmail={session.user.email}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileNav userName={session.user.name ?? session.user.email} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
