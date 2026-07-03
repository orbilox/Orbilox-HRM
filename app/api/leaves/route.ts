import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { sendEmail, emailLayout } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (status && status !== "ALL") where.status = status;

    const leaves = await db.leave.findMany({
      where,
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, department: true } },
        leaveType: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error("[LEAVES_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const employeeId = session.user.employeeId ?? data.employeeId;

    if (!employeeId) return NextResponse.json({ error: "No employee linked to this account" }, { status: 400 });

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await db.leave.create({
      data: {
        employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate,
        endDate,
        days,
        reason: data.reason ?? "",
        status: "PENDING",
      },
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, email: true, managerId: true } },
        leaveType: true,
      },
    });

    // Notify manager that employee submitted a leave request
    if (leave.employee.managerId) {
      const manager = await db.employee.findUnique({
        where: { id: leave.employee.managerId },
        select: { firstName: true, email: true },
      });
      if (manager?.email) {
        await sendEmail({
          to: [{ email: manager.email, name: manager.firstName }],
          subject: `📋 Leave Request from ${leave.employee.firstName} ${leave.employee.lastName}`,
          htmlContent: emailLayout("New Leave Request", `
            <p>Hi ${manager.firstName},</p>
            <p><strong>${leave.employee.firstName} ${leave.employee.lastName}</strong> has submitted a leave request that requires your approval.</p>
            <table style="width:100%;margin:20px 0;border-collapse:collapse;border-radius:8px;overflow:hidden;">
              <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;width:40%;">Leave Type</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${leave.leaveType.name}</td></tr>
              <tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">From</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${startDate.toDateString()}</td></tr>
              <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">To</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${endDate.toDateString()}</td></tr>
              <tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Days</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${days} day${days !== 1 ? "s" : ""}</td></tr>
              ${leave.reason ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Reason</td><td style="padding:10px 14px;color:#374151;">${leave.reason}</td></tr>` : ""}
            </table>
            <a href="https://hr.orbilox.com/leaves" style="display:inline-block;margin-top:16px;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Review Request →</a>
          `),
        }).catch(() => null);
      }
    }

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error("[LEAVES_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
