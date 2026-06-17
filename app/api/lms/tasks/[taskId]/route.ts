import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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
