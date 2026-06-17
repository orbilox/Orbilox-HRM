import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "HR" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, tasks } = body;

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const existing = await db.learningModule.count({ where: { courseId: params.id } });

  const module = await db.learningModule.create({
    data: {
      courseId: params.id,
      title,
      description: description || null,
      order: existing,
      tasks: tasks?.length
        ? {
            create: tasks.map((t: { title: string; description?: string; type?: string; content?: string; dueInDays?: number }, i: number) => ({
              title: t.title,
              description: t.description || null,
              type: t.type || "READING",
              content: t.content || null,
              dueInDays: t.dueInDays || null,
              order: i,
            })),
          }
        : undefined,
    },
    include: { tasks: true },
  });

  return NextResponse.json(module, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await req.json();
  await db.learningModule.delete({ where: { id: moduleId, courseId: params.id } });
  return NextResponse.json({ ok: true });
}
