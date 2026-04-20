import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Called once when the chat page loads to ensure default channels exist
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.employeeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const employeeId = session.user.employeeId;

    const defaults = [
      { name: "general", description: "Company-wide announcements and conversations" },
      { name: "random",  description: "Non-work banter and fun stuff" },
    ];

    // Fast-path: if both channels already exist, return instantly — no DB writes
    const existingCount = await db.chatRoom.count({
      where: { name: { in: ["general", "random"] }, type: "CHANNEL" },
    });
    if (existingCount >= defaults.length) {
      return NextResponse.json({ ok: true });
    }

    // First-time only: fetch employees and create missing channels
    const employees = await db.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    const allIds = employees.map((e) => e.id);

    for (const ch of defaults) {
      const existing = await db.chatRoom.findFirst({ where: { name: ch.name, type: "CHANNEL" } });
      if (!existing) {
        await db.chatRoom.create({
          data: {
            name: ch.name,
            description: ch.description,
            type: "CHANNEL",
            createdBy: employeeId,
            participants: { create: allIds.map((id) => ({ employeeId: id })) },
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[chat/seed POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
