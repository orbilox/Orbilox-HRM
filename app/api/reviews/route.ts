import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { sendEmail, emailLayout } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const reviewerId = searchParams.get("reviewerId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (reviewerId) where.reviewerId = reviewerId;
    if (status) where.status = status;

    const reviews = await db.review.findMany({
      where,
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, designation: true, department: true } },
        reviewer: { select: { id: true, employeeCode: true, firstName: true, lastName: true, designation: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("[REVIEWS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.employeeId || !data.reviewerId) {
      return NextResponse.json({ error: "employeeId and reviewerId are required" }, { status: 400 });
    }

    const review = await db.review.create({
      data: {
        employeeId: data.employeeId,
        reviewerId: data.reviewerId,
        period: data.period ?? "Annual",
        year: data.year ? parseInt(data.year) : new Date().getFullYear(),
        ratings: data.ratings ? JSON.stringify(data.ratings) : JSON.stringify({ technical: 0, communication: 0, teamwork: 0, leadership: 0, overall: 0 }),
        strengths: data.strengths ?? null,
        improvements: data.improvements ?? null,
        comments: data.comments ?? null,
        status: data.status ?? "PENDING",
      },
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, designation: true, email: true } },
        reviewer: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
      },
    });

    // Notify employee that a performance review has been initiated
    if (review.employee.email) {
      await sendEmail({
        to: [{ email: review.employee.email, name: review.employee.firstName }],
        subject: `📊 Your Performance Review Has Been Initiated`,
        htmlContent: emailLayout("Performance Review Started", `
          <p>Hi ${review.employee.firstName},</p>
          <p>A performance review has been initiated for you by <strong>${review.reviewer.firstName} ${review.reviewer.lastName}</strong>.</p>
          <table style="width:100%;margin:20px 0;border-collapse:collapse;border-radius:8px;overflow:hidden;">
            <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;width:40%;">Review Period</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${review.period}</td></tr>
            <tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Year</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${review.year}</td></tr>
            <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Reviewer</td><td style="padding:10px 14px;font-weight:700;color:#4f46e5;">${review.reviewer.firstName} ${review.reviewer.lastName}</td></tr>
            <tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Status</td><td style="padding:10px 14px;font-weight:700;color:#d97706;">Pending</td></tr>
          </table>
          <p>Log in to the HRM portal to view the details of your performance review.</p>
          <a href="https://hr.orbilox.com/performance" style="display:inline-block;margin-top:16px;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">View My Review →</a>
        `),
      }).catch(() => null);
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("[REVIEWS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
