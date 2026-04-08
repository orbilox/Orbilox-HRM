import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IndianRupee, Users, FileText, ChevronLeft, ChevronRight, Send,
  TrendingDown, Wallet, CalendarDays,
} from "lucide-react";
import Link from "next/link";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Server Action ────────────────────────────────────────────────────────────
async function generatePayroll(month: number, year: number) {
  "use server";
  const daysInMonth = new Date(year, month, 0).getDate();
  const employees = await db.employee.findMany({ where: { status: "ACTIVE" } });

  for (const employee of employees) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    const presentCount = await db.attendance.count({
      where: {
        employeeId: employee.id,
        date: { gte: monthStart, lte: monthEnd },
        status: { in: ["PRESENT", "HALF_DAY"] },
      },
    });
    const daysWorked = presentCount > 0 ? presentCount : 26;
    const perDaySalary = (employee.basicSalary || 0) / daysInMonth;
    const basicEarned = parseFloat((perDaySalary * daysWorked).toFixed(2));
    const hra = employee.hra || 0;
    const da = employee.da || 0;
    const ta = employee.ta || 0;
    const otherAllowance = employee.otherAllowance || 0;
    const grossSalary = parseFloat((basicEarned + hra + da + ta + otherAllowance).toFixed(2));
    const pfEmployee = employee.pfEmployee || 0;
    const esiEmployee = employee.esiEmployee || 0;
    const professionalTax = employee.professionalTax || 0;
    const totalDeductions = parseFloat((pfEmployee + esiEmployee + professionalTax).toFixed(2));
    const netSalary = parseFloat((grossSalary - totalDeductions).toFixed(2));

    await db.payslip.upsert({
      where: { employeeId_month_year: { employeeId: employee.id, month, year } },
      create: {
        employeeId: employee.id, month, year, daysInMonth, daysWorked,
        basicSalary: basicEarned, hra, da, ta, otherAllowance, grossSalary,
        pfEmployee, pfEmployer: employee.pfEmployer || 0,
        esiEmployee, esiEmployer: employee.esiEmployer || 0,
        professionalTax, totalDeductions, netSalary, status: "DRAFT",
      },
      update: {
        daysInMonth, daysWorked, basicSalary: basicEarned, hra, da, ta,
        otherAllowance, grossSalary, pfEmployee, pfEmployer: employee.pfEmployer || 0,
        esiEmployee, esiEmployer: employee.esiEmployer || 0,
        professionalTax, totalDeductions, netSalary,
      },
    });
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/payroll");
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role ?? "EMPLOYEE";
  const isAdmin = role === "ADMIN" || role === "HR" || role === "MANAGER";

  const params = await searchParams;
  const now = new Date();
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10);
  const year = parseInt(params.year ?? String(now.getFullYear()), 10);
  const validMonth = Math.min(Math.max(month, 1), 12);
  const validYear = Math.max(year, 2000);

  const prevMonth = validMonth === 1 ? 12 : validMonth - 1;
  const prevYear = validMonth === 1 ? validYear - 1 : validYear;
  const nextMonth = validMonth === 12 ? 1 : validMonth + 1;
  const nextYear = validMonth === 12 ? validYear + 1 : validYear;

  const MonthNav = () => (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm">
      <Link href={`/payroll?month=${prevMonth}&year=${prevYear}`} className="p-2 hover:bg-gray-50 rounded-l-lg transition-colors">
        <ChevronLeft className="w-4 h-4 text-gray-500" />
      </Link>
      <span className="px-3 py-2 text-sm font-medium text-gray-700 min-w-[130px] text-center">
        {MONTH_NAMES[validMonth - 1]} {validYear}
      </span>
      <Link href={`/payroll?month=${nextMonth}&year=${nextYear}`} className="p-2 hover:bg-gray-50 rounded-r-lg transition-colors">
        <ChevronRight className="w-4 h-4 text-gray-500" />
      </Link>
    </div>
  );

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

    const payslips = await db.payslip.findMany({
      where: { employeeId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const currentSlip = payslips.find((p) => p.month === validMonth && p.year === validYear) ?? null;

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
            <p className="text-gray-500 mt-1">{MONTH_NAMES[validMonth - 1]} {validYear}</p>
          </div>
          <MonthNav />
        </div>

        {currentSlip ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Gross Salary</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentSlip.grossSalary)}</p>
                      <p className="text-xs text-gray-400 mt-1">{currentSlip.daysWorked}/{currentSlip.daysInMonth} days worked</p>
                    </div>
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Deductions</p>
                      <p className="text-2xl font-bold text-red-600">-{formatCurrency(currentSlip.totalDeductions)}</p>
                      <p className="text-xs text-gray-400 mt-1">PF + ESI + PT</p>
                    </div>
                    <div className="p-2.5 bg-red-50 rounded-xl">
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-green-100 mb-1">Net Salary</p>
                      <p className="text-2xl font-bold">{formatCurrency(currentSlip.netSalary)}</p>
                      <Badge variant="secondary" className="text-xs mt-1 bg-white/20 text-white border-0">
                        {currentSlip.status}
                      </Badge>
                    </div>
                    <div className="p-2.5 bg-white/20 rounded-xl">
                      <IndianRupee className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Earnings & Deductions breakdown */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700">Earnings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Basic Salary", value: currentSlip.basicSalary },
                    { label: "HRA", value: currentSlip.hra },
                    { label: "DA", value: currentSlip.da },
                    { label: "TA", value: currentSlip.ta },
                    { label: "Other Allowance", value: currentSlip.otherAllowance },
                  ].filter((r) => r.value > 0).map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{row.label}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(row.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-semibold border-t pt-3">
                    <span className="text-gray-800">Gross Total</span>
                    <span className="text-blue-700">{formatCurrency(currentSlip.grossSalary)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700">Deductions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "PF (Employee)", value: currentSlip.pfEmployee },
                    { label: "PF (Employer)", value: currentSlip.pfEmployer },
                    { label: "ESI (Employee)", value: currentSlip.esiEmployee },
                    { label: "ESI (Employer)", value: currentSlip.esiEmployer },
                    { label: "Professional Tax", value: currentSlip.professionalTax },
                    { label: "TDS", value: currentSlip.tds },
                  ].filter((r) => r.value > 0).map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{row.label}</span>
                      <span className="font-medium text-red-600">-{formatCurrency(row.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-semibold border-t pt-3">
                    <span className="text-gray-800">Total Deductions</span>
                    <span className="text-red-600">-{formatCurrency(currentSlip.totalDeductions)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No payslip for {MONTH_NAMES[validMonth - 1]} {validYear}</p>
              <p className="text-sm mt-1">Your payslip hasn&apos;t been generated yet. Please check back later.</p>
            </CardContent>
          </Card>
        )}

        {/* Payslip history */}
        {payslips.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                Payslip History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {payslips.map((slip) => (
                  <div
                    key={slip.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${slip.month === validMonth && slip.year === validYear ? "bg-purple-50 border border-purple-100" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{MONTH_NAMES[slip.month - 1]} {slip.year}</p>
                        <p className="text-xs text-gray-400">{slip.daysWorked} days worked</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">Net Salary</p>
                        <p className="text-sm font-bold text-green-700">{formatCurrency(slip.netSalary)}</p>
                      </div>
                      <Badge variant={slip.status === "PUBLISHED" ? "success" : "secondary"} className="text-xs">
                        {slip.status}
                      </Badge>
                      <Link
                        href={`/payroll?month=${slip.month}&year=${slip.year}`}
                        className="text-xs text-purple-600 hover:underline font-medium"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  const [payslips, totalEmployees] = await Promise.all([
    db.payslip.findMany({
      where: { month: validMonth, year: validYear },
      include: {
        employee: {
          select: {
            id: true, firstName: true, lastName: true,
            employeeCode: true, designation: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { employee: { firstName: "asc" } },
    }),
    db.employee.count({ where: { status: "ACTIVE" } }),
  ]);

  const totalPayroll = payslips.reduce((sum, p) => sum + p.netSalary, 0);
  const publishedCount = payslips.filter((p) => p.status === "PUBLISHED").length;
  const draftCount = payslips.filter((p) => p.status === "DRAFT").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-500 mt-1">{MONTH_NAMES[validMonth - 1]} {validYear} payroll overview</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav />
          <form action={async () => { "use server"; await generatePayroll(validMonth, validYear); }}>
            <Button type="submit">
              <Send className="w-4 h-4 mr-2" />
              Generate Payroll
            </Button>
          </form>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Payroll</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPayroll)}</p>
                <p className="text-xs text-gray-400 mt-1">Net salaries for {validMonth}/{validYear}</p>
              </div>
              <div className="p-2.5 bg-green-50 rounded-xl">
                <IndianRupee className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
                <p className="text-xs text-gray-400 mt-1">{payslips.length} payslips generated</p>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Published Payslips</p>
                <p className="text-2xl font-bold text-gray-900">{publishedCount}</p>
                <p className="text-xs text-gray-400 mt-1">{draftCount} draft{draftCount !== 1 ? "s" : ""} remaining</p>
              </div>
              <div className="p-2.5 bg-purple-50 rounded-xl">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslips table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            Employee Payslips — {MONTH_NAMES[validMonth - 1]} {validYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No payslips generated</p>
              <p className="text-sm mt-1">Click "Generate Payroll" to create payslips for {MONTH_NAMES[validMonth - 1]} {validYear}</p>
              <form className="mt-4 inline-block" action={async () => { "use server"; await generatePayroll(validMonth, validYear); }}>
                <Button type="submit" size="sm">
                  <Send className="w-4 h-4 mr-2" />Generate Now
                </Button>
              </form>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 font-medium text-gray-500">Employee</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Department</th>
                    <th className="text-right pb-3 font-medium text-gray-500">Gross Salary</th>
                    <th className="text-right pb-3 font-medium text-gray-500">Deductions</th>
                    <th className="text-right pb-3 font-medium text-gray-500">Net Salary</th>
                    <th className="text-left pb-3 font-medium text-gray-500 pl-4">Days</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Status</th>
                    <th className="text-right pb-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payslips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {slip.employee.firstName[0]}{slip.employee.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{slip.employee.firstName} {slip.employee.lastName}</div>
                            <div className="text-xs text-gray-400">{slip.employee.employeeCode}{slip.employee.designation ? ` · ${slip.employee.designation}` : ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{slip.employee.department?.name ?? "—"}</td>
                      <td className="py-3 pr-4 text-right text-gray-700 font-medium">{formatCurrency(slip.grossSalary)}</td>
                      <td className="py-3 pr-4 text-right text-red-600">-{formatCurrency(slip.totalDeductions)}</td>
                      <td className="py-3 pr-4 text-right text-green-700 font-semibold">{formatCurrency(slip.netSalary)}</td>
                      <td className="py-3 pr-4 pl-4 text-gray-600 text-center">{slip.daysWorked}/{slip.daysInMonth}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={slip.status === "PUBLISHED" ? "success" : "secondary"} className="text-xs">{slip.status}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/payroll/${slip.id}`} className="text-blue-600 hover:underline text-xs font-medium">View Slip</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td colSpan={2} className="py-3 pr-4 font-medium text-gray-700 text-sm">Total ({payslips.length} employees)</td>
                    <td className="py-3 pr-4 text-right font-semibold text-gray-800">{formatCurrency(payslips.reduce((s, p) => s + p.grossSalary, 0))}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-red-700">-{formatCurrency(payslips.reduce((s, p) => s + p.totalDeductions, 0))}</td>
                    <td className="py-3 pr-4 text-right font-bold text-green-800">{formatCurrency(totalPayroll)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
