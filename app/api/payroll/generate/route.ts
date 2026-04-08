import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const { month, year } = data;

    if (!month || !year) {
      return NextResponse.json({ error: "month and year are required" }, { status: 400 });
    }

    // Number of days in the given month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Fetch all active employees with salary details
    const employees = await db.employee.findMany({
      where: { status: "ACTIVE" },
    });

    const results = [];

    for (const employee of employees) {
      // Fetch actual attendance for the month to compute daysWorked
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59);

      const presentCount = await db.attendance.count({
        where: {
          employeeId: employee.id,
          date: { gte: monthStart, lte: monthEnd },
          status: { in: ["PRESENT", "HALF_DAY"] },
        },
      });

      // Default to 26 working days if no attendance data
      const daysWorked = presentCount > 0 ? presentCount : 26;

      const perDaySalary = (employee.basicSalary || 0) / daysInMonth;

      // Earnings
      const basicEarned = parseFloat((perDaySalary * daysWorked).toFixed(2));
      const hra = employee.hra || 0;
      const da = employee.da || 0;
      const ta = employee.ta || 0;
      const otherAllowance = employee.otherAllowance || 0;
      const grossSalary = parseFloat(
        (basicEarned + hra + da + ta + otherAllowance).toFixed(2)
      );

      // Deductions
      const pfEmployee = employee.pfEmployee || 0;
      const esiEmployee = employee.esiEmployee || 0;
      const professionalTax = employee.professionalTax || 0;
      const totalDeductions = parseFloat(
        (pfEmployee + esiEmployee + professionalTax).toFixed(2)
      );

      const netSalary = parseFloat((grossSalary - totalDeductions).toFixed(2));

      // Upsert payslip for the employee for this month/year
      const payslip = await db.payslip.upsert({
        where: {
          employeeId_month_year: {
            employeeId: employee.id,
            month,
            year,
          },
        },
        create: {
          employeeId: employee.id,
          month,
          year,
          daysInMonth,
          daysWorked,
          basicSalary: basicEarned,
          hra,
          da,
          ta,
          otherAllowance,
          grossSalary,
          pfEmployee,
          pfEmployer: employee.pfEmployer || 0,
          esiEmployee,
          esiEmployer: employee.esiEmployer || 0,
          professionalTax,
          totalDeductions,
          netSalary,
          status: "GENERATED",
        },
        update: {
          daysInMonth,
          daysWorked,
          basicSalary: basicEarned,
          hra,
          da,
          ta,
          otherAllowance,
          grossSalary,
          pfEmployee,
          pfEmployer: employee.pfEmployer || 0,
          esiEmployee,
          esiEmployer: employee.esiEmployer || 0,
          professionalTax,
          totalDeductions,
          netSalary,
          status: "GENERATED",
        },
      });

      results.push(payslip);
    }

    return NextResponse.json(
      { message: `Payroll generated for ${results.length} employee(s)`, payslips: results },
      { status: 201 }
    );
  } catch (error) {
    console.error("[PAYROLL_GENERATE_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
