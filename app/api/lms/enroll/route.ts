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
    db.learningCourse.findUnique({ where: { id: courseId }, select: { title: true, description: true } }),
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

  // Notify enrolled employees by email — fire and forget, don't block the response
  if (enrolled > 0 && course) {
    db.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { firstName: true, email: true },
    }).then((employees) => {
      Promise.allSettled(
        employees.map((emp) =>
          sendEmail({
            to: [{ email: emp.email, name: emp.firstName }],
            subject: `New course assigned: ${course.title}`,
            htmlContent: emailLayout(
              "You've been assigned a new course",
              `<p>Hi ${emp.firstName},</p>
               <p>Your manager has assigned you a new learning course:</p>
               <p style="font-size:16px; font-weight:600; color:#4f46e5; margin: 16px 0;">${course.title}</p>
               ${course.description ? `<p style="color:#6b7280;">${course.description}</p>` : ""}
               <p>Log in to your LMS dashboard to start learning. Remember — assignments are due every Saturday.</p>
               <a href="https://hr.orbilox.com/lms" style="display:inline-block; margin-top:16px; background:#4f46e5; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600;">Go to My Learning</a>`
            ),
          })
        )
      );
    }).catch((err) => console.error("Failed to send enrollment emails:", err));
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
