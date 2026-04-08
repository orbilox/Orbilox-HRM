import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const departments = await db.department.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("[DEPARTMENTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.name) return NextResponse.json({ error: "Department name is required" }, { status: 400 });

    const department = await db.department.create({
      data: { name: data.name, description: data.description ?? null },
      include: { _count: { select: { employees: true } } },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("[DEPARTMENTS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
