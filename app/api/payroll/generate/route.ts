import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { sendEmail, emailLayout } from "@/lib/email";

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

    // Notify each employee their payslip is ready
    const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const monthName = MONTHS[month - 1];
    await Promise.allSettled(
      employees.map((emp) =>
        emp.email ? sendEmail({
          to: [{ email: emp.email, name: emp.firstName }],
          subject: `💰 Your Payslip for ${monthName} ${year} is Ready`,
          htmlContent: emailLayout(`Payslip for ${monthName} ${year}`, `
            <p>Hi ${emp.firstName},</p>
            <p>Your payslip for <strong>${monthName} ${year}</strong> has been generated and is now available on the Orbilox HRM portal.</p>
            <div style="background:#f0fdf4;border-left:4px solid #059669;border-radius:8px;padding:16px 20px;margin:20px 0;">
              <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Net Salary</p>
              <p style="margin:0;font-size:28px;font-weight:800;color:#059669;">₹${(emp.basicSalary + emp.hra + emp.da + emp.ta + emp.otherAllowance - emp.pfEmployee - emp.esiEmployee - emp.professionalTax).toFixed(2)}</p>
            </div>
            <p>Log in to the HRM portal to view, download, or print your detailed payslip.</p>
            <a href="https://hr.orbilox.com/payroll" style="display:inline-block;margin-top:16px;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">View My Payslip →</a>
          `),
        }) : Promise.resolve()
      )
    );

    return NextResponse.json(
      { message: `Payroll generated for ${results.length} employee(s)`, payslips: results },
      { status: 201 }
    );
  } catch (error) {
    console.error("[PAYROLL_GENERATE_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
