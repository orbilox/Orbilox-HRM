import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

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
      include: { employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } } },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("[GOALS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
