import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const holidays = await db.holiday.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(holidays);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const data = await req.json();
    const holiday = await db.holiday.create({
      data: { name: data.name, date: new Date(data.date), type: data.type ?? "NATIONAL", description: data.description ?? null },
    });
    return NextResponse.json(holiday, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 });
  }
}
