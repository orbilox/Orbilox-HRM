import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { sendEmail, emailLayout } from "@/lib/email";

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
      include: { job: { select: { title: true } } },
    });

    // Notify candidate if stage changed
    if (data.stage && data.stage !== existing.stage && application.candidateEmail) {
      const stageMessages: Record<string, { emoji: string; label: string; msg: string }> = {
        SHORTLISTED:  { emoji: "🎯", label: "Shortlisted",        msg: "Great news! You have been shortlisted and our team will be in touch with next steps." },
        INTERVIEW:    { emoji: "📅", label: "Interview Scheduled", msg: "Congratulations! You have been selected for an interview. Our HR team will contact you with the schedule details." },
        OFFERED:      { emoji: "🎉", label: "Offer Extended",      msg: "We are pleased to inform you that we are extending an offer to you! Our HR team will reach out with the offer details." },
        HIRED:        { emoji: "🚀", label: "Hired",               msg: "Welcome aboard! We are thrilled to have you join the Orbilox team. HR will be in touch with onboarding details." },
        REJECTED:     { emoji: "📩", label: "Application Update",  msg: "Thank you for your interest in Orbilox. After careful consideration, we have decided to move forward with other candidates at this time. We encourage you to apply again in the future." },
      };
      const info = stageMessages[data.stage];
      if (info) {
        await sendEmail({
          to: [{ email: application.candidateEmail, name: application.candidateName }],
          subject: `${info.emoji} ${info.label} — ${application.job.title} at Orbilox`,
          htmlContent: emailLayout(`${info.emoji} ${info.label}`, `
            <p>Hi ${application.candidateName},</p>
            <p>${info.msg}</p>
            <div style="background:#f0f4ff;border-left:4px solid #4f46e5;border-radius:8px;padding:14px 18px;margin:20px 0;">
              <p style="margin:0;color:#6b7280;font-size:13px;">Position Applied For</p>
              <p style="margin:4px 0 0;font-weight:700;color:#4f46e5;">${application.job.title}</p>
            </div>
            <p style="color:#6b7280;font-size:13px;">If you have any questions, feel free to reach out to our HR team.</p>
          `),
        }).catch(() => null);
      }
    }

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
