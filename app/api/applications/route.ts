import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { sendEmail, emailLayout } from "@/lib/email";

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

    // Notify HR/Admin about new application
    const hrUsers = await db.user.findMany({
      where: { role: { in: ["ADMIN", "HR"] } },
      include: { employee: { select: { firstName: true, email: true } } },
    });
    await Promise.allSettled(hrUsers.map((u) => {
      const email = u.employee?.email ?? u.email;
      const name = u.employee?.firstName ?? "HR";
      return sendEmail({
        to: [{ email, name }],
        subject: `📨 New Application for ${application.job.title}`,
        htmlContent: emailLayout("New Job Application Received", `
          <p>Hi ${name},</p>
          <p>A new application has been submitted for <strong>${application.job.title}</strong>.</p>
          <table style="width:100%;margin:20px 0;border-collapse:collapse;border-radius:8px;overflow:hidden;">
            <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;width:40%;">Candidate</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${application.candidateName}</td></tr>
            <tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Email</td><td style="padding:10px 14px;color:#111827;">${application.candidateEmail}</td></tr>
            ${application.candidatePhone ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Phone</td><td style="padding:10px 14px;color:#111827;">${application.candidatePhone}</td></tr>` : ""}
            <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Position</td><td style="padding:10px 14px;font-weight:700;color:#4f46e5;">${application.job.title}</td></tr>
          </table>
          <a href="https://hr.orbilox.com/recruitment" style="display:inline-block;margin-top:16px;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Review Application →</a>
        `),
      });
    }));

    // Confirm receipt to the candidate
    if (application.candidateEmail) {
      await sendEmail({
        to: [{ email: application.candidateEmail, name: application.candidateName }],
        subject: `✅ Application Received — ${application.job.title} at Orbilox`,
        htmlContent: emailLayout("Application Received!", `
          <p>Hi ${application.candidateName},</p>
          <p>Thank you for applying for the <strong>${application.job.title}</strong> position at <strong>Orbilox</strong>. We have received your application and our team will review it shortly.</p>
          <p>We'll reach out to you at this email address if your profile matches our requirements.</p>
          <p style="color:#6b7280;font-size:13px;">Best of luck! 🤞</p>
        `),
      }).catch(() => null);
    }

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("[APPLICATIONS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
