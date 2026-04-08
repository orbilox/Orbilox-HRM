import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ShieldCheck, Users, CheckCircle, Clock, XCircle, AlertCircle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import KYCForm from "@/components/kyc/kyc-form";

const profileStatusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  NOT_STARTED:  { label: "Not Started",    variant: "secondary" },
  IN_PROGRESS:  { label: "In Progress",    variant: "default" },
  SUBMITTED:    { label: "Submitted",      variant: "warning" },
  UNDER_REVIEW: { label: "Under Review",   variant: "warning" },
  APPROVED:     { label: "Approved",       variant: "success" },
  REJECTED:     { label: "Action Needed",  variant: "destructive" },
};

export default async function KYCPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role ?? "EMPLOYEE";
  const isAdmin = role === "ADMIN" || role === "HR" || role === "MANAGER";

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  if (isAdmin) {
    const employees = await db.employee.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        designation: true,
        department: { select: { name: true } },
        kycProfile: true,
        kycDocuments: true,
      },
      orderBy: { firstName: "asc" },
    });

    const stats = {
      total: employees.length,
      approved: employees.filter((e) => e.kycProfile?.status === "APPROVED").length,
      pending: employees.filter((e) => !e.kycProfile || e.kycProfile.status === "NOT_STARTED" || e.kycProfile.status === "IN_PROGRESS").length,
      submitted: employees.filter((e) => e.kycProfile?.status === "SUBMITTED" || e.kycProfile?.status === "UNDER_REVIEW").length,
      rejected: employees.filter((e) => e.kycProfile?.status === "REJECTED").length,
    };

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KYC Management</h1>
            <p className="text-gray-500 mt-1">Review and verify employee KYC documents</p>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Employees", value: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "KYC Approved", value: stats.approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
            { label: "Awaiting Review", value: stats.submitted, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Not Submitted", value: stats.pending, icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-100" },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                  <div className={`p-2 rounded-lg ${s.bg}`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Employee KYC table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              Employee KYC Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 font-medium text-gray-500">Employee</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Department</th>
                    <th className="text-left pb-3 font-medium text-gray-500">KYC Status</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Completion</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Docs Verified</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Submitted</th>
                    <th className="text-right pb-3 font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map((emp) => {
                    const ps = emp.kycProfile?.status ?? "NOT_STARTED";
                    const sc = profileStatusConfig[ps] ?? profileStatusConfig.NOT_STARTED;
                    const pct = emp.kycProfile?.completionPct ?? 0;
                    const verifiedCount = emp.kycDocuments.filter((d) => d.status === "VERIFIED").length;
                    const totalDocs = emp.kycDocuments.length;

                    return (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</div>
                              <div className="text-xs text-gray-400">{emp.employeeCode}{emp.designation ? ` · ${emp.designation}` : ""}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-600 text-sm">{emp.department?.name ?? "—"}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-purple-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs text-gray-600">
                            {verifiedCount}/{totalDocs} docs
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-xs text-gray-400">
                          {emp.kycProfile?.submittedAt
                            ? new Date(emp.kycProfile.submittedAt).toLocaleDateString("en-IN")
                            : "—"}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/kyc/${emp.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 hover:underline"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── EMPLOYEE VIEW ──────────────────────────────────────────────────────────
  const employeeId = session.user.employeeId;
  if (!employeeId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Your account is not linked to an employee profile. Please contact HR.
      </div>
    );
  }

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    select: { firstName: true, lastName: true, employeeCode: true, designation: true, department: { select: { name: true } } },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My KYC</h1>
          <p className="text-gray-500 mt-1">
            {employee?.firstName} {employee?.lastName} · {employee?.employeeCode}
            {employee?.department?.name ? ` · ${employee.department.name}` : ""}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
        </div>
      </div>

      <KYCForm />
    </div>
  );
}
