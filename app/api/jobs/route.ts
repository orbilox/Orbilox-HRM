import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const jobs = await db.job.findMany({
      where,
      include: { department: true, _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("[JOBS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();

    const job = await db.job.create({
      data: {
        title: data.title,
        description: data.description ?? "",
        departmentId: data.departmentId ?? null,
        location: data.location ?? null,
        type: data.type ?? "FULL_TIME",
        experience: data.experience ?? null,
        salary: data.salary ?? null,
        requirements: data.requirements ?? null,
        openings: data.openings ? parseInt(data.openings) : 1,
        status: data.status ?? "OPEN",
      },
      include: { department: true, _count: { select: { applications: true } } },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("[JOBS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
