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
    if (status) where.status = status;

    const goals = await db.goal.findMany({
      where,
      include: { employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("[GOALS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.title) return NextResponse.json({ error: "Goal title is required" }, { status: 400 });

    const employeeId = data.employeeId ?? session.user.employeeId;
    if (!employeeId) return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });

    const goal = await db.goal.create({
      data: {
        employeeId,
        title: data.title,
        description: data.description ?? null,
        category: data.category ?? "PERFORMANCE",
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        progress: data.progress ? parseInt(data.progress) : 0,
        status: data.status ?? "IN_PROGRESS",
        year: data.year ? parseInt(data.year) : new Date().getFullYear(),
        quarter: data.quarter ?? null,
      },
      include: { employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, email: true } } },
    });

    // Notify employee if goal was assigned by someone else (manager assigning to them)
    const assignedBySelf = session.user.employeeId === employeeId;
    if (!assignedBySelf && goal.employee.email) {
      await sendEmail({
        to: [{ email: goal.employee.email, name: goal.employee.firstName }],
        subject: `🎯 New Goal Assigned to You`,
        htmlContent: emailLayout("New Goal Assigned", `
          <p>Hi ${goal.employee.firstName},</p>
          <p>Your manager has assigned a new goal to you. Here are the details:</p>
          <table style="width:100%;margin:20px 0;border-collapse:collapse;border-radius:8px;overflow:hidden;">
            <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;width:40%;">Goal</td><td style="padding:10px 14px;font-weight:700;color:#4f46e5;">${goal.title}</td></tr>
            <tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Category</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${goal.category}</td></tr>
            <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Year</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${goal.year}${goal.quarter ? ` · ${goal.quarter}` : ""}</td></tr>
            ${goal.targetDate ? `<tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Target Date</td><td style="padding:10px 14px;font-weight:700;color:#d97706;">${new Date(goal.targetDate).toDateString()}</td></tr>` : ""}
            ${goal.description ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Description</td><td style="padding:10px 14px;color:#374151;">${goal.description}</td></tr>` : ""}
          </table>
          <p>Log in to the HRM portal to track your progress.</p>
          <a href="https://hr.orbilox.com/performance" style="display:inline-block;margin-top:16px;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">View My Goals →</a>
        `),
      }).catch(() => null);
    }

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("[GOALS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
