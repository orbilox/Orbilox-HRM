import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (status && status !== "ALL") where.status = status;

    const leaves = await db.leave.findMany({
      where,
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, department: true } },
        leaveType: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error("[LEAVES_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const employeeId = session.user.employeeId ?? data.employeeId;

    if (!employeeId) return NextResponse.json({ error: "No employee linked to this account" }, { status: 400 });

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await db.leave.create({
      data: {
        employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate,
        endDate,
        days,
        reason: data.reason ?? "",
        status: "PENDING",
      },
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
        leaveType: true,
      },
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error("[LEAVES_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
