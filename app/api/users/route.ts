import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session || !["ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, email: true, role: true, employeeId: true, createdAt: true, updatedAt: true,
      employee: { select: { firstName: true, lastName: true } },
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const data = await req.json();
    const hashed = await bcrypt.hash(data.password, 10);
    const user = await db.user.create({
      data: {
        email: data.email,
        password: hashed,
        role: data.role ?? "EMPLOYEE",
        employeeId: data.employeeId ?? null,
      },
    });
    return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
