import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { sendEmail, emailLayout } from "@/lib/email";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const { status, comments } = data;

    if (!status || !["APPROVED", "REJECTED", "CANCELLED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const { id } = await params;
    const existing = await db.leave.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Leave request not found" }, { status: 404 });

    const leave = await db.leave.update({
      where: { id },
      data: {
        status,
        comments: comments ?? null,
        approvedBy: session.user.id,
        approvedAt: ["APPROVED", "REJECTED"].includes(status) ? new Date() : null,
      },
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, email: true } },
        leaveType: true,
      },
    });

    // Notify employee of approval/rejection decision
    if (["APPROVED", "REJECTED"].includes(status) && leave.employee.email) {
      const isApproved = status === "APPROVED";
      await sendEmail({
        to: [{ email: leave.employee.email, name: leave.employee.firstName }],
        subject: `${isApproved ? "✅" : "❌"} Leave Request ${isApproved ? "Approved" : "Rejected"}`,
        htmlContent: emailLayout(
          `Your Leave Has Been ${isApproved ? "Approved" : "Rejected"}`,
          `<p>Hi ${leave.employee.firstName},</p>
           <p>Your leave request has been <strong style="color:${isApproved ? "#059669" : "#dc2626"};">${status.toLowerCase()}</strong>.</p>
           <table style="width:100%;margin:20px 0;border-collapse:collapse;border-radius:8px;overflow:hidden;">
             <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;width:40%;">Leave Type</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${leave.leaveType.name}</td></tr>
             <tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">From</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${new Date(leave.startDate).toDateString()}</td></tr>
             <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">To</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${new Date(leave.endDate).toDateString()}</td></tr>
             <tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Days</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${leave.days}</td></tr>
             ${comments ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Comments</td><td style="padding:10px 14px;color:#374151;">${comments}</td></tr>` : ""}
           </table>
           ${!isApproved ? `<p style="color:#6b7280;font-size:13px;">If you have questions, please contact your manager or HR.</p>` : `<p style="color:#059669;font-size:13px;">Enjoy your time off! 🎉</p>`}
           <a href="https://hr.orbilox.com/leaves" style="display:inline-block;margin-top:16px;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">View My Leaves →</a>`
        ),
      }).catch(() => null);
    }

    return NextResponse.json(leave);
  } catch (error) {
    console.error("[LEAVE_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
