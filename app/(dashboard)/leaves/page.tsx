import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, CheckCircle, XCircle, Filter, Calendar } from "lucide-react";
import Link from "next/link";
import ApplyLeaveDialog from "@/components/leaves/apply-leave-dialog";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

const statusVariant: Record<LeaveStatus, "warning" | "success" | "destructive" | "secondary"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  CANCELLED: "secondary",
};

async function approveLeave(id: string) {
  "use server";
  await db.leave.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date() } });
}

async function rejectLeave(id: string) {
  "use server";
  await db.leave.update({ where: { id }, data: { status: "REJECTED" } });
}

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default async function LeavesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role ?? "EMPLOYEE";
  const isAdmin = role === "ADMIN" || role === "HR" || role === "MANAGER";

  const params = await searchParams;
  const activeStatus = params.status ?? "ALL";

  // ── EMPLOYEE VIEW ──────────────────────────────────────────────────────────
  if (!isAdmin) {
    const employeeId = session?.user?.employeeId;
    if (!employeeId) {
      return (
        <div className="p-8 text-center text-gray-500">
          Your account is not linked to an employee profile. Please contact HR.
        </div>
      );
    }

    const [leaves, leaveTypes] = await Promise.all([
      db.leave.findMany({
        where: {
          employeeId,
          ...(activeStatus !== "ALL" ? { status: activeStatus } : {}),
        },
        include: { leaveType: true },
        orderBy: { createdAt: "desc" },
      }),
      db.leaveType.findMany({ orderBy: { name: "asc" } }),
    ]);

    const summary = {
      total: leaves.length,
      pending: leaves.filter((l) => l.status === "PENDING").length,
      approved: leaves.filter((l) => l.status === "APPROVED").length,
      rejected: leaves.filter((l) => l.status === "REJECTED").length,
    };

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Leaves</h1>
            <p className="text-gray-500 mt-1">Track and apply for your leave requests</p>
          </div>
          <ApplyLeaveDialog leaveTypes={leaveTypes} />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: summary.total, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Pending", value: summary.pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Approved", value: summary.approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
            { label: "Rejected", value: summary.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
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

        {/* Leave list */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                My Leave Requests
              </CardTitle>
              <div className="flex items-center gap-1 sm:ml-auto flex-wrap">
                {STATUS_FILTERS.map((s) => (
                  <Link
                    key={s}
                    href={`/leaves?status=${s}`}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeStatus === s ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {leaves.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-gray-500">No leave requests found</p>
                <p className="text-sm mt-1">
                  {activeStatus !== "ALL" ? `No ${activeStatus.toLowerCase()} requests` : "You haven't applied for any leave yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaves.map((leave) => (
                  <div key={leave.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-purple-100 hover:bg-purple-50/30 transition-all">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${leave.leaveType.color}20` }}>
                      <CalendarDays className="w-5 h-5" style={{ color: leave.leaveType.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{leave.leaveType.name}</span>
                        <Badge variant={statusVariant[leave.status as LeaveStatus] ?? "secondary"} className="text-xs">
                          {leave.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(leave.startDate)}
                        {leave.startDate.toDateString() !== leave.endDate.toDateString() && ` → ${formatDate(leave.endDate)}`}
                        {" · "}{leave.days} day{leave.days !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">{leave.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{formatDate(leave.createdAt)}</p>
                      {leave.approvedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">Actioned: {formatDate(leave.approvedAt)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  const [leaves, leaveTypes] = await Promise.all([
    db.leave.findMany({
      where: activeStatus !== "ALL" ? { status: activeStatus } : undefined,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        leaveType: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.leaveType.findMany({ orderBy: { name: "asc" } }),
  ]);

  const summary = {
    pending: leaves.filter((l) => l.status === "PENDING").length,
    approved: leaves.filter((l) => l.status === "APPROVED").length,
    rejected: leaves.filter((l) => l.status === "REJECTED").length,
    total: leaves.length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-500 mt-1">Review and manage employee leave requests</p>
        </div>
        <ApplyLeaveDialog leaveTypes={leaveTypes} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: summary.total, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending", value: summary.pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Approved", value: summary.approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Rejected", value: summary.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
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

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              Leave Requests
            </CardTitle>
            <div className="flex items-center gap-1 sm:ml-auto flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <Link
                  key={s}
                  href={`/leaves?status=${s}`}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeStatus === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leaves.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No leave requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 font-medium text-gray-500">Employee</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Type</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Date Range</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Days</th>
                    <th className="text-left pb-3 font-medium text-gray-500 max-w-[200px]">Reason</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Status</th>
                    <th className="text-right pb-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {leave.employee.firstName[0]}{leave.employee.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{leave.employee.firstName} {leave.employee.lastName}</div>
                            <div className="text-xs text-gray-400">{leave.employee.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${leave.leaveType.color}20`, color: leave.leaveType.color }}>
                          {leave.leaveType.name}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                        {formatDate(leave.startDate)}{leave.startDate.toDateString() !== leave.endDate.toDateString() && <> &rarr; {formatDate(leave.endDate)}</>}
                      </td>
                      <td className="py-3 pr-4 text-gray-700 font-medium">{leave.days} {leave.days === 1 ? "day" : "days"}</td>
                      <td className="py-3 pr-4 max-w-[200px]"><p className="text-gray-600 truncate" title={leave.reason}>{leave.reason}</p></td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusVariant[leave.status as LeaveStatus] ?? "secondary"} className="text-xs">{leave.status}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        {leave.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-2">
                            <form action={async () => { "use server"; await approveLeave(leave.id); }}>
                              <button type="submit" className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline px-2 py-1 rounded hover:bg-green-50 transition-colors">Approve</button>
                            </form>
                            <form action={async () => { "use server"; await rejectLeave(leave.id); }}>
                              <button type="submit" className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline px-2 py-1 rounded hover:bg-red-50 transition-colors">Reject</button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">{leave.approvedAt ? formatDate(leave.approvedAt) : "—"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
