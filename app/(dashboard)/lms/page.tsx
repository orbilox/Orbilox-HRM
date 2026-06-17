import { auth } from "@/auth";
import { db } from "@/lib/db";
import LmsManager from "@/components/lms/lms-manager";
import LmsIntern from "@/components/lms/lms-intern";
import { GraduationCap } from "lucide-react";

export default async function LmsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role ?? "EMPLOYEE";
  const isManager = role === "ADMIN" || role === "HR" || role === "MANAGER";

  // ── MANAGER VIEW ─────────────────────────────────────────────────────────
  if (isManager) {
    const [courses, interns] = await Promise.all([
      db.learningCourse.findMany({
        include: {
          modules: {
            include: { tasks: { orderBy: { order: "asc" } } },
            orderBy: { order: "asc" },
          },
          enrollments: {
            include: {
              employee: {
                select: { id: true, firstName: true, lastName: true, employeeCode: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true, employmentType: true },
        orderBy: { firstName: "asc" },
      }),
    ]);

    return <LmsManager courses={courses as never} interns={interns} />;
  }

  // ── INTERN / EMPLOYEE VIEW ────────────────────────────────────────────────
  const employeeId = session.user.employeeId;
  if (!employeeId) {
    return (
      <div className="p-8 text-center text-gray-500">
        <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Your account is not linked to an employee profile. Please contact HR.</p>
      </div>
    );
  }

  const [enrollments, completions] = await Promise.all([
    db.courseEnrollment.findMany({
      where: { employeeId },
      include: {
        course: {
          include: {
            modules: {
              include: { tasks: { orderBy: { order: "asc" } } },
              orderBy: { order: "asc" },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    db.taskCompletion.findMany({
      where: { employeeId },
      select: { taskId: true },
    }),
  ]);

  const completedTaskIds = completions.map((c) => c.taskId);

  return (
    <LmsIntern
      enrollments={enrollments as never}
      completedTaskIds={completedTaskIds}
    />
  );
}
