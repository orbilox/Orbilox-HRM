import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const { status, comments } = data;

    if (!status || !["APPROVED", "REJECTED", "CANCELLED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const { id } = await params;
    const existing = await db.leave.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Leave request not found" }, { status: 404 });

    const leave = await db.leave.update({
      where: { id },
      data: {
        status,
        comments: comments ?? null,
        approvedBy: session.user.id,
        approvedAt: ["APPROVED", "REJECTED"].includes(status) ? new Date() : null,
      },
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
        leaveType: true,
      },
    });

    return NextResponse.json(leave);
  } catch (error) {
    console.error("[LEAVE_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
