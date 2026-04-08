import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const stage = searchParams.get("stage");

    const where: Record<string, unknown> = {};
    if (jobId) where.jobId = jobId;
    if (stage) where.stage = stage;

    const applications = await db.application.findMany({
      where,
      include: { job: { select: { id: true, title: true, department: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("[APPLICATIONS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const job = await db.job.findUnique({ where: { id: data.jobId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.status !== "OPEN") return NextResponse.json({ error: "Job is no longer accepting applications" }, { status: 400 });

    const application = await db.application.create({
      data: {
        jobId: data.jobId,
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
        candidatePhone: data.candidatePhone ?? null,
        resumeUrl: data.resumeUrl ?? null,
        coverLetter: data.coverLetter ?? null,
        stage: "APPLIED",
        notes: data.notes ?? null,
      },
      include: { job: { select: { id: true, title: true } } },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("[APPLICATIONS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
