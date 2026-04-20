import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "orbilox-check-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employees = await db.employee.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { email: true, role: true } } },
  });

  return NextResponse.json({ count: employees.length, employees });
}
