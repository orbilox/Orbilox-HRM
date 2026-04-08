import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const job = await db.job.findUnique({
      where: { id },
      include: {
        department: true,
        applications: { orderBy: { createdAt: "desc" } },
        _count: { select: { applications: true } },
      },
    });

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    return NextResponse.json(job);
  } catch (error) {
    console.error("[JOB_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();

    const { id } = await params;
    const existing = await db.job.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const job = await db.job.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        description: data.description ?? existing.description,
        departmentId: data.departmentId ?? existing.departmentId,
        location: data.location ?? existing.location,
        type: data.type ?? existing.type,
        experience: data.experience ?? existing.experience,
        salary: data.salary ?? existing.salary,
        requirements: data.requirements ?? existing.requirements,
        openings: data.openings !== undefined ? parseInt(data.openings) : existing.openings,
        status: data.status ?? existing.status,
      },
      include: { department: true, _count: { select: { applications: true } } },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("[JOB_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: jobId } = await params;
    await db.job.delete({ where: { id: jobId } });
    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("[JOB_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
