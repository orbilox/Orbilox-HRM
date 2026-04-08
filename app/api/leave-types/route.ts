import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const leaveTypes = await db.leaveType.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(leaveTypes);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.name) return NextResponse.json({ error: "Leave type name is required" }, { status: 400 });

    const leaveType = await db.leaveType.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        daysAllowed: data.daysAllowed ? parseInt(data.daysAllowed) : 0,
        isPaid: data.isPaid !== undefined ? Boolean(data.isPaid) : true,
        carryForward: data.carryForward !== undefined ? Boolean(data.carryForward) : false,
        color: data.color ?? "#3b82f6",
      },
    });

    return NextResponse.json(leaveType, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
