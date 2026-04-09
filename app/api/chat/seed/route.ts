import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Called once when the chat page loads to ensure default channels exist
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.employeeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const employeeId = session.user.employeeId;

    // Get all active employees
    const employees = await db.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    const allIds = employees.map((e) => e.id);

    // Create default channels if they don't exist
    const defaults = [
      { name: "general", description: "Company-wide announcements and conversations" },
      { name: "random", description: "Non-work banter and fun stuff" },
    ];

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
      } else {
        // Add any employees not yet in the channel
        for (const id of allIds) {
          await db.chatParticipant.upsert({
            where: { roomId_employeeId: { roomId: existing.id, employeeId: id } },
            create: { roomId: existing.id, employeeId: id },
            update: {},
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[chat/seed POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
