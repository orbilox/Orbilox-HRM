import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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

  const results = await Promise.allSettled(
    employeeIds.map((employeeId: string) =>
      db.courseEnrollment.upsert({
        where: { courseId_employeeId: { courseId, employeeId } },
        update: {},
        create: { courseId, employeeId, enrolledBy },
      })
    )
  );

  const enrolled = results.filter((r) => r.status === "fulfilled").length;
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
