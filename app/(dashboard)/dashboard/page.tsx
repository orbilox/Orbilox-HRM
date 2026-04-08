import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Clock, Calendar, DollarSign, TrendingUp, UserCheck,
  UserX, Briefcase, Cake, Award, UserPlus, Megaphone, MapPin,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import TimeWidget from "@/components/dashboard/employee/time-widget";
import HolidayCarousel from "@/components/dashboard/employee/holiday-carousel";
import PostFeed from "@/components/dashboard/employee/post-feed";

// ─── Admin data ───────────────────────────────────────────────────────────────
async function getAdminDashboardData() {
  const [
    totalEmployees, activeEmployees, todayAttendance,
    pendingLeaves, recentEmployees, openJobs, pendingReviews,
  ] = await Promise.all([
    db.employee.count(),
    db.employee.count({ where: { status: "ACTIVE" } }),
    db.attendance.count({ where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    db.leave.count({ where: { status: "PENDING" } }),
    db.employee.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { department: true } }),
    db.job.count({ where: { status: "OPEN" } }),
    db.review.count({ where: { status: "PENDING" } }),
  ]);
  return { totalEmployees, activeEmployees, todayAttendance, pendingLeaves, recentEmployees, openJobs, pendingReviews };
}

// ─── Employee data ────────────────────────────────────────────────────────────
async function getEmployeeDashboardData(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // upcoming holidays (next 90 days)
  const futureLimit = new Date(today);
  futureLimit.setDate(futureLimit.getDate() + 90);

  // birthday window: today + 30 days
  const birthdayWindow = new Date(today);
  birthdayWindow.setDate(birthdayWindow.getDate() + 30);

  const [
    employee,
    todayAttendance,
    pendingLeaves,
    recentLeaves,
    recentPayslips,
    goals,
    announcements,
    holidays,
    onLeaveToday,
    allEmployees,
  ] = await Promise.all([
    db.employee.findUnique({
      where: { id: employeeId },
      include: { department: true },
    }),
    db.attendance.findFirst({ where: { employeeId, date: { gte: today } } }),
    db.leave.count({ where: { employeeId, status: "PENDING" } }),
    db.leave.findMany({
      where: { employeeId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { leaveType: true },
    }),
    db.payslip.findMany({
      where: { employeeId },
      take: 3,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
    db.goal.findMany({
      where: { employeeId, status: "IN_PROGRESS" },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    db.announcement.findMany({
      where: {
        OR: [{ targetRole: null }, { targetRole: "EMPLOYEE" }],
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.holiday.findMany({
      where: { date: { gte: today, lte: futureLimit } },
      orderBy: { date: "asc" },
      take: 6,
    }),
    db.leave.findMany({
      where: { status: "APPROVED", startDate: { lte: tomorrow }, endDate: { gte: today } },
      include: { employee: { select: { firstName: true, lastName: true, designation: true, department: { select: { name: true } } } } },
      take: 8,
    }),
    db.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true, joiningDate: true, designation: true },
    }),
  ]);

  // birthdays & anniversaries in next 30 days
  const todayMMDD = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const upcomingBirthdays = allEmployees
    .filter((e) => e.dateOfBirth)
    .map((e) => {
      const dob = new Date(e.dateOfBirth!);
      const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
      return { ...e, nextBirthday: thisYear };
    })
    .filter((e) => e.nextBirthday <= birthdayWindow)
    .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime())
    .slice(0, 5);

  const upcomingAnniversaries = allEmployees
    .map((e) => {
      const join = new Date(e.joiningDate);
      const thisYear = new Date(today.getFullYear(), join.getMonth(), join.getDate());
      if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
      const years = today.getFullYear() - join.getFullYear() + (thisYear.getFullYear() > today.getFullYear() ? 0 : 0);
      return { ...e, nextAnniversary: thisYear, years };
    })
    .filter((e) => e.nextAnniversary >= today && e.nextAnniversary <= birthdayWindow)
    .sort((a, b) => a.nextAnniversary.getTime() - b.nextAnniversary.getTime())
    .slice(0, 5);

  // new joinees this month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const newJoinees = allEmployees
    .filter((e) => new Date(e.joiningDate) >= monthStart)
    .slice(0, 5);

  return {
    employee, todayAttendance, pendingLeaves, recentLeaves,
    recentPayslips, goals, announcements, holidays, onLeaveToday,
    upcomingBirthdays, upcomingAnniversaries, newJoinees,
  };
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Avatar({ name, size = "md", color = "bg-purple-600" }: { name: string; size?: "sm" | "md"; color?: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`${color} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"}`}>
      {initials}
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
async function AdminDashboard({ session }: { session: { user: { name?: string | null; role?: string | null } } }) {
  const data = await getAdminDashboardData();
  const today = new Date();

  const stats = [
    { title: "Total Employees", value: data.totalEmployees, icon: Users, color: "text-blue-600", bg: "bg-blue-50", sub: `${data.activeEmployees} active` },
    { title: "Present Today", value: data.todayAttendance, icon: UserCheck, color: "text-green-600", bg: "bg-green-50", sub: today.toDateString() },
    { title: "Leave Requests", value: data.pendingLeaves, icon: Calendar, color: "text-orange-600", bg: "bg-orange-50", sub: "Awaiting approval" },
    { title: "Open Positions", value: data.openJobs, icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50", sub: "Active job openings" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {today.getHours() < 12 ? "morning" : today.getHours() < 17 ? "afternoon" : "evening"},{" "}
            {session?.user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-gray-500 mt-1">{formatDate(today)} — Here&apos;s your HR overview</p>
        </div>
        <Badge variant="success" className="text-xs hidden sm:flex">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 inline-block" />
          System Online
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 font-medium">{stat.title}</span>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Recently Joined Employees</span>
                <a href="/employees" className="text-xs text-blue-600 font-normal hover:underline">View all</a>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentEmployees.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No employees yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs text-gray-400 truncate">{emp.designation ?? "—"} · {emp.department?.name ?? "No dept"}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-gray-400">{formatDate(emp.joiningDate)}</div>
                        <Badge variant={emp.status === "ACTIVE" ? "success" : "secondary"} className="text-xs mt-0.5">{emp.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/employees/new", label: "Add Employee", icon: Users, color: "bg-blue-600" },
                { href: "/leaves", label: "Review Leaves", icon: Calendar, color: "bg-orange-500" },
                { href: "/payroll", label: "Process Payroll", icon: DollarSign, color: "bg-green-600" },
                { href: "/recruitment/new", label: "Post Job", icon: Briefcase, color: "bg-purple-600" },
              ].map((action) => (
                <a key={action.href} href={action.href} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                  <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{action.label}</span>
                </a>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <CardContent className="p-5">
              <TrendingUp className="w-8 h-8 mb-3 text-blue-200" />
              <div className="text-xl font-bold">{data.pendingReviews}</div>
              <div className="text-sm text-blue-100">Pending Performance Reviews</div>
              <a href="/performance" className="text-xs text-yellow-300 hover:underline mt-2 inline-block">Review now →</a>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Platform Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { href: "/employees", label: "Employees", icon: Users, color: "text-blue-600 bg-blue-50" },
              { href: "/attendance", label: "Attendance", icon: Clock, color: "text-green-600 bg-green-50" },
              { href: "/leaves", label: "Leaves", icon: Calendar, color: "text-orange-600 bg-orange-50" },
              { href: "/payroll", label: "Payroll", icon: DollarSign, color: "text-teal-600 bg-teal-50" },
              { href: "/performance", label: "Performance", icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
              { href: "/recruitment", label: "Recruitment", icon: Briefcase, color: "text-pink-600 bg-pink-50" },
              { href: "/documents", label: "Documents", icon: UserX, color: "text-indigo-600 bg-indigo-50" },
              { href: "/settings", label: "Settings", icon: UserCheck, color: "text-gray-600 bg-gray-100" },
            ].map((mod) => (
              <a key={mod.href} href={mod.href} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors text-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mod.color}`}>
                  <mod.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-600">{mod.label}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── EMPLOYEE DASHBOARD ───────────────────────────────────────────────────────
async function EmployeeDashboard({ session }: { session: { user: { name?: string | null; employeeId?: string | null } } }) {
  const employeeId = session?.user?.employeeId;
  if (!employeeId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Your account is not linked to an employee profile. Please contact HR.
      </div>
    );
  }

  const data = await getEmployeeDashboardData(employeeId);

  const holidays = data.holidays.map((h) => ({
    id: h.id,
    name: h.name,
    date: h.date.toISOString(),
    type: h.type,
  }));

  const checkIn = data.todayAttendance?.checkIn?.toISOString() ?? null;
  const checkOut = data.todayAttendance?.checkOut?.toISOString() ?? null;

  const today = new Date();
  const greeting = today.getHours() < 12 ? "morning" : today.getHours() < 17 ? "afternoon" : "evening";

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* ── Welcome Banner ── */}
      <div
        className="relative overflow-hidden px-6 py-8"
        style={{ background: "linear-gradient(135deg, #4C1D95 0%, #5B21B6 40%, #6D28D9 70%, #7C3AED 100%)" }}
      >
        {/* decorative blobs */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute right-24 top-4 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -left-8 bottom-0 w-48 h-24 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-purple-200 text-sm font-medium">{data.employee?.department?.name ?? ""}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Good {greeting}, {session?.user?.name?.split(" ")[0] ?? "there"}!
          </h1>
          <p className="text-purple-200 text-sm mt-1">
            {data.employee?.designation ?? "Employee"} · {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 p-5 grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── LEFT: Quick Access ── */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Quick Access</h2>

          {/* Holidays Carousel */}
          <HolidayCarousel holidays={holidays} />

          {/* On Leave Today */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                On Leave Today
              </h3>
              <a href="/leaves" className="text-xs text-purple-600 hover:underline">View All</a>
            </div>
            {data.onLeaveToday.length === 0 ? (
              <div className="flex items-center gap-3 py-3">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Everyone is working today!</p>
                  <p className="text-xs text-gray-400">No one is on leave today.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {data.onLeaveToday.map((l) => (
                  <div key={l.id} className="flex items-center gap-2">
                    <Avatar name={`${l.employee.firstName} ${l.employee.lastName}`} size="sm" color="bg-orange-500" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{l.employee.firstName} {l.employee.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">{l.employee.designation ?? l.employee.department?.name ?? ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Working Remotely placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Working Remotely
              </h3>
            </div>
            <div className="flex items-center gap-3 py-2">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Everyone is at office!</p>
                <p className="text-xs text-gray-400">No one is working remotely today.</p>
              </div>
            </div>
          </div>

          {/* Time Today */}
          <TimeWidget checkIn={checkIn} checkOut={checkOut} />

          {/* My Recent Leaves */}
          {data.recentLeaves.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">My Leave History</h3>
                <a href="/leaves" className="text-xs text-purple-600 hover:underline">View All</a>
              </div>
              <div className="space-y-2">
                {data.recentLeaves.slice(0, 3).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: leave.leaveType.color }}
                      />
                      <span className="text-xs text-gray-700">{leave.leaveType.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{leave.days}d</span>
                      <Badge
                        variant={leave.status === "APPROVED" ? "success" : leave.status === "REJECTED" ? "destructive" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Feed + Social ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Post / Poll / Praise */}
          <PostFeed />

          {/* Announcements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-purple-500" />
                Announcements
              </h3>
            </div>
            {data.announcements.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">No announcements</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.announcements.map((a) => (
                  <div key={a.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${a.priority === "HIGH" ? "bg-red-500" : a.priority === "NORMAL" ? "bg-blue-500" : "bg-gray-300"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{formatDate(a.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Birthdays / Anniversaries / New Joinees */}
          <BirthdaysSection
            birthdays={data.upcomingBirthdays.map((e) => ({ name: `${e.firstName} ${e.lastName}`, date: e.nextBirthday.toISOString(), designation: e.designation ?? "" }))}
            anniversaries={data.upcomingAnniversaries.map((e) => ({ name: `${e.firstName} ${e.lastName}`, date: e.nextAnniversary.toISOString(), years: new Date().getFullYear() - new Date(e.joiningDate).getFullYear(), designation: e.designation ?? "" }))}
            newJoinees={data.newJoinees.map((e) => ({ name: `${e.firstName} ${e.lastName}`, date: e.joiningDate.toISOString(), designation: e.designation ?? "" }))}
          />

          {/* Payslips */}
          {data.recentPayslips.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-teal-500" />
                  Recent Payslips
                </h3>
                <a href="/payroll" className="text-xs text-purple-600 hover:underline">View All</a>
              </div>
              <div className="space-y-2">
                {data.recentPayslips.map((slip) => (
                  <div key={slip.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{MONTH_NAMES[slip.month - 1]} {slip.year}</p>
                      <p className="text-xs text-gray-400">{slip.daysWorked} days worked</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(slip.netSalary)}</p>
                      <Badge variant={slip.status === "PUBLISHED" ? "success" : "secondary"} className="text-[10px]">
                        {slip.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {data.goals.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  My Goals
                </h3>
                <a href="/performance" className="text-xs text-purple-600 hover:underline">View All</a>
              </div>
              <div className="space-y-3">
                {data.goals.map((goal) => (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate flex-1 mr-3">{goal.title}</span>
                      <span className="text-xs font-semibold text-purple-600">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-purple-600 h-1.5 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Birthdays Section (sub-component) ───────────────────────────────────────
function BirthdaysSection({
  birthdays,
  anniversaries,
  newJoinees,
}: {
  birthdays: { name: string; date: string; designation: string }[];
  anniversaries: { name: string; date: string; years: number; designation: string }[];
  newJoinees: { name: string; date: string; designation: string }[];
}) {
  const tabs = [
    { key: "birthdays", label: `${birthdays.length} Birthdays`, icon: Cake, items: birthdays, color: "text-pink-600", emptyMsg: "No upcoming birthdays" },
    { key: "anniversaries", label: `${anniversaries.length} Work Anniversaries`, icon: Award, items: anniversaries, color: "text-yellow-600", emptyMsg: "No upcoming anniversaries" },
    { key: "joinees", label: `${newJoinees.length} New Joinees`, icon: UserPlus, items: newJoinees, color: "text-blue-600", emptyMsg: "No new joinees this month" },
  ] as const;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* static header showing all three counts */}
      <div className="flex border-b border-gray-100">
        {tabs.map((t) => (
          <div key={t.key} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium text-gray-600 border-r last:border-r-0 border-gray-100">
            <t.icon className={`w-3.5 h-3.5 ${t.color}`} />
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming Birthdays */}
      <div className="p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Upcoming Birthdays</p>
        {birthdays.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">No upcoming birthdays in the next 30 days.</p>
        ) : (
          <div className="space-y-2">
            {birthdays.map((b) => (
              <div key={b.name + b.date} className="flex items-center gap-2.5">
                <Avatar name={b.name} size="sm" color="bg-pink-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{b.name}</p>
                  <p className="text-xs text-gray-400 truncate">{b.designation}</p>
                </div>
                <span className="text-xs text-pink-600 font-medium shrink-0">
                  {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}

        {newJoinees.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-500 mt-4 mb-3 uppercase tracking-wide">New Joinees This Month</p>
            <div className="space-y-2">
              {newJoinees.map((j) => (
                <div key={j.name + j.date} className="flex items-center gap-2.5">
                  <Avatar name={j.name} size="sm" color="bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{j.name}</p>
                    <p className="text-xs text-gray-400 truncate">{j.designation}</p>
                  </div>
                  <span className="text-xs text-blue-600 font-medium shrink-0">
                    {new Date(j.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PAGE ENTRY POINT ─────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role ?? "EMPLOYEE";
  const isAdmin = role === "ADMIN" || role === "HR" || role === "MANAGER";

  if (isAdmin) {
    return <AdminDashboard session={session as any} />;
  }
  return <EmployeeDashboard session={session as any} />;
}
