import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, UserCheck, UserX, AlarmClock, Plane, CalendarDays, TrendingUp, LogIn, LogOut } from "lucide-react";
import AttendanceActions from "@/components/attendance/attendance-actions";
import AttendanceDatePicker from "@/components/attendance/date-picker";
import Link from "next/link";

type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "HOLIDAY" | "WEEKEND";

const statusVariant: Record<AttendanceStatus, "success" | "destructive" | "warning" | "info" | "secondary"> = {
  PRESENT: "success",
  ABSENT: "destructive",
  HALF_DAY: "warning",
  ON_LEAVE: "info",
  HOLIDAY: "secondary",
  WEEKEND: "secondary",
};

function formatTime(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string; year?: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role ?? "EMPLOYEE";
  const isAdmin = role === "ADMIN" || role === "HR" || role === "MANAGER";

  const params = await searchParams;
  const today = new Date().toISOString().split("T")[0];

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

    const now = new Date();
    const month = parseInt(params.month ?? String(now.getMonth() + 1), 10);
    const year = parseInt(params.year ?? String(now.getFullYear()), 10);
    const validMonth = Math.min(Math.max(month, 1), 12);
    const validYear = Math.max(year, 2000);

    const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    const monthStart = new Date(validYear, validMonth - 1, 1);
    const monthEnd = new Date(validYear, validMonth, 0, 23, 59, 59);

    const [records, todayRecord] = await Promise.all([
      db.attendance.findMany({
        where: { employeeId, date: { gte: monthStart, lte: monthEnd } },
        orderBy: { date: "desc" },
      }),
      db.attendance.findFirst({
        where: { employeeId, date: { gte: new Date(new Date().setHours(0,0,0,0)) } },
      }),
    ]);

    const present = records.filter((r) => r.status === "PRESENT").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const halfDay = records.filter((r) => r.status === "HALF_DAY").length;
    const onLeave = records.filter((r) => r.status === "ON_LEAVE").length;
    const totalHours = records.reduce((s, r) => s + (r.hoursWorked ?? 0), 0);

    const prevMonth = validMonth === 1 ? 12 : validMonth - 1;
    const prevYear = validMonth === 1 ? validYear - 1 : validYear;
    const nextMonth = validMonth === 12 ? 1 : validMonth + 1;
    const nextYear = validMonth === 12 ? validYear + 1 : validYear;
    const isCurrentMonth = validMonth === now.getMonth() + 1 && validYear === now.getFullYear();

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
            <p className="text-gray-500 mt-1">{MONTH_NAMES[validMonth - 1]} {validYear}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Month nav */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm">
              <Link href={`/attendance?month=${prevMonth}&year=${prevYear}`} className="p-2 hover:bg-gray-50 rounded-l-lg transition-colors">
                <CalendarDays className="w-4 h-4 text-gray-500" />
              </Link>
              <span className="px-3 py-2 text-sm font-medium text-gray-700 min-w-[140px] text-center">
                {MONTH_NAMES[validMonth - 1]} {validYear}
              </span>
              <Link href={`/attendance?month=${nextMonth}&year=${nextYear}`} className={`p-2 hover:bg-gray-50 rounded-r-lg transition-colors ${isCurrentMonth ? "opacity-30 pointer-events-none" : ""}`}>
                <CalendarDays className="w-4 h-4 text-gray-500" />
              </Link>
            </div>
            {isCurrentMonth && <AttendanceActions />}
          </div>
        </div>

        {/* Today's status */}
        {isCurrentMonth && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 text-white flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Today — {formatDate(today)}</p>
              <p className="text-xl font-bold mt-1">
                {todayRecord?.checkIn
                  ? `Checked in at ${formatTime(todayRecord.checkIn)}`
                  : "Not checked in yet"}
              </p>
              {todayRecord?.checkOut && (
                <p className="text-purple-200 text-sm mt-0.5">Checked out at {formatTime(todayRecord.checkOut)}</p>
              )}
              {todayRecord?.hoursWorked && (
                <p className="text-purple-200 text-sm mt-0.5">{todayRecord.hoursWorked.toFixed(1)} hours worked</p>
              )}
            </div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${todayRecord?.checkIn ? "bg-green-400/30" : "bg-white/10"}`}>
              {todayRecord?.checkOut ? <LogOut className="w-7 h-7" /> : todayRecord?.checkIn ? <LogIn className="w-7 h-7 text-green-300" /> : <Clock className="w-7 h-7 text-purple-300" />}
            </div>
          </div>
        )}

        {/* Monthly stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Present", value: present, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
            { label: "Absent", value: absent, icon: UserX, color: "text-red-600", bg: "bg-red-50" },
            { label: "Half Day", value: halfDay, icon: AlarmClock, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "On Leave", value: onLeave, icon: Plane, color: "text-blue-600", bg: "bg-blue-50" },
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

        {/* Total hours */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Hours Worked — {MONTH_NAMES[validMonth - 1]}</p>
              <p className="text-2xl font-bold text-blue-700">{totalHours.toFixed(1)} hrs</p>
            </div>
          </CardContent>
        </Card>

        {/* Attendance log */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Attendance Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-gray-500">No records for {MONTH_NAMES[validMonth - 1]} {validYear}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-3 font-medium text-gray-500">Date</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Check-In</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Check-Out</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Hours</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4 text-gray-700 font-medium">{formatDate(r.date)}</td>
                        <td className="py-3 pr-4 text-gray-600">{formatTime(r.checkIn)}</td>
                        <td className="py-3 pr-4 text-gray-600">{formatTime(r.checkOut)}</td>
                        <td className="py-3 pr-4 text-gray-600">
                          {r.hoursWorked != null ? `${r.hoursWorked.toFixed(1)}h` : "—"}
                        </td>
                        <td className="py-3">
                          <Badge variant={statusVariant[r.status as AttendanceStatus] ?? "secondary"} className="text-xs">
                            {r.status.replace("_", " ")}
                          </Badge>
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

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  const selectedDate = params.date ?? today;
  const date = new Date(selectedDate);
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const records = await db.attendance.findMany({
    where: { date: { gte: date, lt: nextDay } },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true },
      },
    },
    orderBy: { employee: { firstName: "asc" } },
  });

  const stats = {
    present: records.filter((r) => r.status === "PRESENT").length,
    absent: records.filter((r) => r.status === "ABSENT").length,
    late: records.filter((r) => r.status === "HALF_DAY").length,
    onLeave: records.filter((r) => r.status === "ON_LEAVE").length,
  };

  const isToday = selectedDate === today;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 mt-1">
            {isToday ? "Today's attendance — " : "Attendance for — "}{formatDate(selectedDate)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AttendanceDatePicker selectedDate={selectedDate} maxDate={today} />
          {isToday && <AttendanceActions />}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Present", value: stats.present, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
          { label: "Absent", value: stats.absent, icon: UserX, color: "text-red-600", bg: "bg-red-50" },
          { label: "Late / Half Day", value: stats.late, icon: AlarmClock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "On Leave", value: stats.onLeave, icon: Plane, color: "text-blue-600", bg: "bg-blue-50" },
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
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            Employee Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No attendance records</p>
              <p className="text-sm mt-1">No records found for {formatDate(selectedDate)}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 font-medium text-gray-500">Employee</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Check-In</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Check-Out</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Hours Worked</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {record.employee.firstName[0]}{record.employee.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{record.employee.firstName} {record.employee.lastName}</div>
                            <div className="text-xs text-gray-400">{record.employee.employeeCode}{record.employee.designation ? ` · ${record.employee.designation}` : ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4"><span className={record.checkIn ? "text-gray-700 font-medium" : "text-gray-400"}>{formatTime(record.checkIn)}</span></td>
                      <td className="py-3 pr-4"><span className={record.checkOut ? "text-gray-700 font-medium" : "text-gray-400"}>{formatTime(record.checkOut)}</span></td>
                      <td className="py-3 pr-4">{record.hoursWorked != null ? <span className="text-gray-700">{record.hoursWorked.toFixed(1)}h</span> : <span className="text-gray-400">—</span>}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusVariant[record.status as AttendanceStatus] ?? "secondary"} className="text-xs">
                          {record.status.replace("_", " ")}
                        </Badge>
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
