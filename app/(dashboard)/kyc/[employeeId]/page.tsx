import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ShieldCheck, ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import KYCAdminActions from "@/components/kyc/kyc-admin-actions";
import { KYC_DOCS } from "@/app/api/kyc/route";

const profileStatusConfig: Record<string, { label: string; color: string; bg: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  NOT_STARTED:  { label: "Not Started",    color: "text-gray-600",   bg: "bg-gray-50",    variant: "secondary" },
  IN_PROGRESS:  { label: "In Progress",    color: "text-blue-700",   bg: "bg-blue-50",    variant: "default" },
  SUBMITTED:    { label: "Submitted",      color: "text-yellow-700", bg: "bg-yellow-50",  variant: "warning" },
  UNDER_REVIEW: { label: "Under Review",   color: "text-orange-700", bg: "bg-orange-50",  variant: "warning" },
  APPROVED:     { label: "KYC Approved",   color: "text-green-700",  bg: "bg-green-50",   variant: "success" },
  REJECTED:     { label: "Action Needed",  color: "text-red-700",    bg: "bg-red-50",     variant: "destructive" },
};

export default async function KYCReviewPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role ?? "EMPLOYEE";
  const isAdmin = role === "ADMIN" || role === "HR" || role === "MANAGER";
  if (!isAdmin) redirect("/kyc");

  const { employeeId } = await params;

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeCode: true,
      designation: true,
      email: true,
      phone: true,
      department: { select: { name: true } },
      joiningDate: true,
      kycProfile: true,
      kycDocuments: {
        orderBy: { docType: "asc" },
      },
    },
  });

  if (!employee) notFound();

  const ps = employee.kycProfile?.status ?? "NOT_STARTED";
  const sc = profileStatusConfig[ps] ?? profileStatusConfig.NOT_STARTED;
  const pct = employee.kycProfile?.completionPct ?? 0;

  // Build full doc list merging config defaults with submitted docs
  const allDocs = KYC_DOCS.map((cfg) => {
    const submitted = employee.kycDocuments.find((d) => d.docType === cfg.docType);
    return submitted ?? {
      id: `placeholder_${cfg.docType}`,
      docType: cfg.docType,
      label: cfg.label,
      docNumber: null,
      fileUrl: null,
      fileName: null,
      status: "PENDING",
      rejectionReason: null,
      verifiedBy: null,
      verifiedAt: null,
      isRequired: cfg.isRequired,
      employeeId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const verifiedCount = employee.kycDocuments.filter((d) => d.status === "VERIFIED").length;
  const submittedCount = employee.kycDocuments.filter((d) => d.status === "SUBMITTED").length;
  const rejectedCount = employee.kycDocuments.filter((d) => d.status === "REJECTED").length;
  const pendingCount = KYC_DOCS.length - employee.kycDocuments.filter((d) => d.status !== "PENDING").length;

  return (
    <div className="p-6 space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Link href="/kyc" className="mt-1 p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">KYC Review</h1>
          <p className="text-gray-500 mt-0.5">
            {employee.firstName} {employee.lastName} · {employee.employeeCode}
            {employee.department?.name ? ` · ${employee.department.name}` : ""}
          </p>
        </div>
        <Badge variant={sc.variant} className="text-sm px-3 py-1 shrink-0">{sc.label}</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT: Employee info + stats */}
        <div className="space-y-4">
          {/* Employee card */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {employee.firstName[0]}{employee.lastName[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{employee.firstName} {employee.lastName}</p>
                  <p className="text-sm text-gray-500">{employee.designation ?? "—"}</p>
                  <p className="text-xs text-gray-400">{employee.department?.name ?? "—"}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Employee Code", value: employee.employeeCode },
                  { label: "Email", value: employee.email },
                  { label: "Phone", value: employee.phone ?? "—" },
                  { label: "Joining Date", value: new Date(employee.joiningDate).toLocaleDateString("en-IN") },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 text-xs">{r.label}</span>
                    <span className="text-gray-700 text-xs font-medium text-right truncate max-w-[140px]">{r.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* KYC progress card */}
          <Card className={`border-0 shadow-sm ${sc.bg}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-bold ${sc.color}`}>KYC Completion</p>
                <ShieldCheck className={`w-5 h-5 ${sc.color}`} />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 bg-white rounded-full h-2.5 overflow-hidden shadow-inner">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${pct === 100 ? "bg-green-500" : "bg-purple-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-lg font-black ${sc.color}`}>{pct}%</span>
              </div>
              {employee.kycProfile?.submittedAt && (
                <p className="text-xs text-gray-500">
                  Submitted: {new Date(employee.kycProfile.submittedAt).toLocaleDateString("en-IN")}
                </p>
              )}
              {employee.kycProfile?.reviewedAt && (
                <p className="text-xs text-gray-500">
                  Reviewed: {new Date(employee.kycProfile.reviewedAt).toLocaleDateString("en-IN")} by {employee.kycProfile.reviewedBy}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Doc stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Verified", value: verifiedCount, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
              { label: "Awaiting", value: submittedCount, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
              { label: "Rejected", value: rejectedCount, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
              { label: "Not Uploaded", value: pendingCount, icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-100" },
            ].map((s) => (
              <Card key={s.label} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-500">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Remarks */}
          {employee.kycProfile?.remarks && (
            <Card className="border-0 shadow-sm bg-orange-50 border-orange-100">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-orange-700 mb-1">HR Remarks</p>
                <p className="text-sm text-orange-800">{employee.kycProfile.remarks}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: Document review */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Document Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KYCAdminActions
                employeeId={employeeId}
                documents={allDocs.filter((d) => d.status !== "PENDING")}
                profileStatus={ps}
                profileRemarks={employee.kycProfile?.remarks ?? null}
              />
            </CardContent>
          </Card>

          {/* Pending docs checklist */}
          {pendingCount > 0 && (
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600">Pending Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allDocs.filter((d) => d.status === "PENDING").map((doc) => (
                    <div key={doc.docType} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">{doc.label}</p>
                      </div>
                      {doc.isRequired && <span className="text-[10px] text-red-500 font-medium">REQUIRED</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
