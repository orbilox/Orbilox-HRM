import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

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
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, designation: true } },
        reviewer: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("[REVIEWS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
