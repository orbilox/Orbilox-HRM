import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ChatApp from "@/components/chat/chat-app";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const employeeId = session.user.employeeId;
  if (!employeeId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center text-gray-500 p-8">
          <p className="font-medium">Your account is not linked to an employee profile.</p>
          <p className="text-sm mt-1">Please contact HR to set up your account.</p>
        </div>
      </div>
    );
  }

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    select: { firstName: true, lastName: true },
  });

  const myName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : (session.user.name ?? session.user.email ?? "Me");

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <ChatApp myEmployeeId={employeeId} myName={myName} />
    </div>
  );
}
