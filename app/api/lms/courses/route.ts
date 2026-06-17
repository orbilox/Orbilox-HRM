import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const isManager = role === "ADMIN" || role === "HR" || role === "MANAGER";

  if (isManager) {
    const courses = await db.learningCourse.findMany({
      include: {
        modules: {
          include: { tasks: true },
          orderBy: { order: "asc" },
        },
        enrollments: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(courses);
  }

  // Employee — only enrolled courses
  const employeeId = session.user.employeeId;
  if (!employeeId) return NextResponse.json([]);

  const enrollments = await db.courseEnrollment.findMany({
    where: { employeeId },
    include: {
      course: {
        include: {
          modules: {
            include: { tasks: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
  return NextResponse.json(enrollments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "HR" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, category } = body;

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const course = await db.learningCourse.create({
    data: {
      title,
      description: description || null,
      category: category || "GENERAL",
      createdBy: session.user.employeeId ?? session.user.id,
    },
  });

  return NextResponse.json(course, { status: 201 });
}
