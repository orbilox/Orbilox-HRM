import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();

    const { id } = await params;
    const existing = await db.goal.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const goal = await db.goal.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        description: data.description !== undefined ? data.description : existing.description,
        category: data.category ?? existing.category,
        targetDate: data.targetDate ? new Date(data.targetDate) : existing.targetDate,
        progress: data.progress !== undefined ? parseInt(data.progress) : existing.progress,
        status: data.status ?? existing.status,
      },
      include: { employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } } },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("[GOAL_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await db.goal.delete({ where: { id } });
    return NextResponse.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("[GOAL_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
