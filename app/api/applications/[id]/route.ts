import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();

    const { id } = await params;
    const existing = await db.application.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    const application = await db.application.update({
      where: { id },
      data: {
        stage: data.stage ?? existing.stage,
        rating: data.rating !== undefined ? Number(data.rating) : existing.rating,
        notes: data.notes ?? existing.notes,
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("[APPLICATION_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: appId } = await params;
  await db.application.delete({ where: { id: appId } });
  return NextResponse.json({ success: true });
}
