import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employeeId = session.user.employeeId;
  if (!employeeId) return NextResponse.json({ error: "No employee profile" }, { status: 400 });

  const { taskId } = await params;
  const body = await req.json().catch(() => ({}));
  const { notes } = body;

  const completion = await db.taskCompletion.upsert({
    where: { taskId_employeeId: { taskId, employeeId } },
    update: { notes: notes || null },
    create: { taskId, employeeId, notes: notes || null },
  });

  // Notify manager when employee completes a task
  const [task, employee] = await Promise.all([
    db.learningTask.findUnique({
      where: { id: taskId },
      select: { title: true, type: true, module: { select: { title: true, course: { select: { title: true } } } } },
    }),
    db.employee.findUnique({
      where: { id: employeeId },
      select: { firstName: true, lastName: true, managerId: true },
    }),
  ]);

  if (task && employee?.managerId) {
    const manager = await db.employee.findUnique({
      where: { id: employee.managerId },
      select: { firstName: true, email: true },
    });
    if (manager?.email) {
      await sendEmail({
        to: [{ email: manager.email, name: manager.firstName }],
        subject: `✅ ${employee.firstName} completed a task — ${task.title}`,
        htmlContent: emailLayout("Task Completed", `
          <p>Hi ${manager.firstName},</p>
          <p><strong>${employee.firstName} ${employee.lastName}</strong> has completed a learning task.</p>
          <table style="width:100%;margin:20px 0;border-collapse:collapse;border-radius:8px;overflow:hidden;">
            <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;width:40%;">Task</td><td style="padding:10px 14px;font-weight:700;color:#059669;">${task.title}</td></tr>
            <tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Module</td><td style="padding:10px 14px;color:#111827;">${task.module.title}</td></tr>
            <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Course</td><td style="padding:10px 14px;color:#4f46e5;font-weight:600;">${task.module.course.title}</td></tr>
            <tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Type</td><td style="padding:10px 14px;color:#111827;">${task.type}</td></tr>
            ${notes ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Notes</td><td style="padding:10px 14px;color:#374151;">${notes}</td></tr>` : ""}
          </table>
          <a href="https://hr.orbilox.com/lms" style="display:inline-block;margin-top:16px;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">View LMS Progress →</a>
        `),
      }).catch(() => null);
    }
  }

  return NextResponse.json(completion);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employeeId = session.user.employeeId;
  if (!employeeId) return NextResponse.json({ error: "No employee profile" }, { status: 400 });

  const { taskId } = await params;
  await db.taskCompletion.deleteMany({ where: { taskId, employeeId } });

  return NextResponse.json({ ok: true });
}
