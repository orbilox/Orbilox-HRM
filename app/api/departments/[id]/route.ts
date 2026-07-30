import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const department = await db.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });

    if (!department) return NextResponse.json({ error: "Department not found" }, { status: 404 });

    if (department._count.employees > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete "${department.name}" — ${department._count.employees} employee(s) are still assigned to it. Reassign them first.`,
        },
        { status: 400 }
      );
    }

    await db.department.delete({ where: { id } });
    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("[DEPARTMENT_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
