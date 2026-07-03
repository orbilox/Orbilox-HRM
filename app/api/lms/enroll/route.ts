import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "HR" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { courseId, employeeIds } = await req.json();
  if (!courseId || !employeeIds?.length) {
    return NextResponse.json({ error: "courseId and employeeIds required" }, { status: 400 });
  }

  const enrolledBy = session.user.employeeId ?? session.user.id;

  const [course, results] = await Promise.all([
    db.learningCourse.findUnique({
      where: { id: courseId },
      select: {
        title: true,
        description: true,
        modules: {
          orderBy: { order: "asc" },
          select: {
            title: true,
            _count: { select: { tasks: true } },
          },
        },
      },
    }),
    Promise.allSettled(
      employeeIds.map((employeeId: string) =>
        db.courseEnrollment.upsert({
          where: { courseId_employeeId: { courseId, employeeId } },
          update: {},
          create: { courseId, employeeId, enrolledBy },
        })
      )
    ),
  ]);

  const enrolled = results.filter((r) => r.status === "fulfilled").length;

  // Notify enrolled employees with full course details
  if (enrolled > 0 && course) {
    const employees = await db.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { firstName: true, email: true },
    });

    const totalTasks = course.modules.reduce((sum, m) => sum + m._count.tasks, 0);
    const moduleCount = course.modules.length;

    const moduleListHtml = course.modules.slice(0, 8).map((m, i) =>
      `<tr style="border-bottom:1px solid #f3f4f6;">
         <td style="padding:10px 14px; color:#6b7280; font-size:13px; width:32px;">${i + 1}</td>
         <td style="padding:10px 14px; color:#111827; font-size:13px; font-weight:500;">${m.title}</td>
         <td style="padding:10px 14px; color:#6b7280; font-size:12px; text-align:right;">${m._count.tasks} task${m._count.tasks !== 1 ? "s" : ""}</td>
       </tr>`
    ).join("") + (moduleCount > 8
      ? `<tr><td colspan="3" style="padding:10px 14px; color:#9ca3af; font-size:12px;">+ ${moduleCount - 8} more modules...</td></tr>`
      : "");

    await Promise.allSettled(
      employees.map((emp) =>
        sendEmail({
          to: [{ email: emp.email, name: emp.firstName }],
          subject: `📚 New Course Assigned: ${course.title}`,
          htmlContent: emailLayout(
            `You've been enrolled in a new course! 📚`,
            `<p>Hi ${emp.firstName},</p>
             <p>Great news! Your manager has assigned you a new learning course on the <strong>Orbilox LMS</strong>. Here's everything you need to know:</p>

             <div style="margin:20px 0; background:#f0f4ff; border-left:4px solid #4f46e5; border-radius:8px; padding:16px 20px;">
               <p style="margin:0 0 4px; font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Course Name</p>
               <p style="margin:0; font-size:20px; font-weight:800; color:#4f46e5;">${course.title}</p>
             </div>

             ${course.description ? `<p style="color:#374151; font-size:14px; line-height:1.7; margin:0 0 20px;">${course.description}</p>` : ""}

             <div style="display:flex; gap:12px; margin:0 0 20px; flex-wrap:wrap;">
               <div style="flex:1; min-width:120px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:14px; text-align:center;">
                 <p style="margin:0; font-size:26px; font-weight:800; color:#4f46e5;">${moduleCount}</p>
                 <p style="margin:4px 0 0; font-size:12px; color:#6b7280;">Module${moduleCount !== 1 ? "s" : ""}</p>
               </div>
               <div style="flex:1; min-width:120px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:14px; text-align:center;">
                 <p style="margin:0; font-size:26px; font-weight:800; color:#059669;">${totalTasks}</p>
                 <p style="margin:4px 0 0; font-size:12px; color:#6b7280;">Total Tasks</p>
               </div>
               <div style="flex:1; min-width:120px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:14px; text-align:center;">
                 <p style="margin:0; font-size:26px; font-weight:800; color:#d97706;">📅</p>
                 <p style="margin:4px 0 0; font-size:12px; color:#6b7280;">Every Saturday</p>
               </div>
             </div>

             ${moduleCount > 0 ? `
             <p style="font-weight:600; color:#111827; margin:0 0 8px;">Course Modules</p>
             <table style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:20px;">
               ${moduleListHtml}
             </table>` : ""}

             <div style="background:#fdf4ff; border:1px solid #e9d5ff; border-radius:8px; padding:14px 16px; margin-bottom:20px;">
               <p style="margin:0 0 4px; font-weight:700; color:#7e22ce; font-size:13px;">📋 Saturday Assignment Sessions</p>
               <p style="margin:0; color:#6b7280; font-size:13px;">Every Saturday from <strong>11:00 AM – 5:00 PM</strong>, you'll have a dedicated assignment session. Your manager will review your completed tasks.</p>
             </div>

             <p style="color:#374151; font-size:14px;">Log in to your LMS portal to start learning, track your progress, and complete your tasks. Let's go! 🚀</p>
             <a href="https://hr.orbilox.com/lms" style="display:inline-block; margin-top:16px; background:#4f46e5; color:#fff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:700; font-size:15px;">Start Learning →</a>`
          ),
        })
      )
    );
  }

  return NextResponse.json({ enrolled });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "HR" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { courseId, employeeId } = await req.json();
  await db.courseEnrollment.deleteMany({ where: { courseId, employeeId } });
  return NextResponse.json({ ok: true });
}
