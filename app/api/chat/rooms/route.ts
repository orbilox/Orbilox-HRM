import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET — fetch all rooms the current employee participates in
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.employeeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const employeeId = session.user.employeeId;

    const rooms = await db.chatRoom.findMany({
      where: {
        isArchived: false,
        participants: { some: { employeeId } },
      },
      include: {
        participants: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, designation: true, department: { select: { name: true } } },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { firstName: true, lastName: true } } },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Count unread per room
    const withUnread = await Promise.all(
      rooms.map(async (room) => {
        const me = room.participants.find((p) => p.employeeId === employeeId);
        const unread = me
          ? await db.chatMessage.count({
              where: {
                roomId: room.id,
                createdAt: { gt: me.lastReadAt },
                isDeleted: false,
                senderId: { not: employeeId },
              },
            })
          : 0;
        return { ...room, unread };
      })
    );

    return NextResponse.json({ rooms: withUnread });
  } catch (err) {
    console.error("[chat/rooms GET]", err);
    return NextResponse.json({ error: "Internal server error", rooms: [] }, { status: 500 });
  }
}

// POST — create a new channel or DM
export async function POST(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user?.employeeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const employeeId = session.user.employeeId;

  const { type, name, description, participantIds } = await req.json();

  // For DMs, check if one already exists
  if (type === "DIRECT" && participantIds?.length === 1) {
    const otherId = participantIds[0];
    const existing = await db.chatRoom.findFirst({
      where: {
        type: "DIRECT",
        participants: { every: { employeeId: { in: [employeeId, otherId] } } },
        AND: [
          { participants: { some: { employeeId } } },
          { participants: { some: { employeeId: otherId } } },
        ],
      },
      include: { participants: true },
    });
    if (existing && existing.participants.length === 2) {
      return NextResponse.json({ room: existing });
    }
  }

  const allParticipants = Array.from(new Set([employeeId, ...(participantIds ?? [])]));

  const room = await db.chatRoom.create({
    data: {
      type: type ?? "CHANNEL",
      name: type === "DIRECT" ? null : (name ?? "New Channel"),
      description: description ?? null,
      createdBy: employeeId,
      participants: {
        create: allParticipants.map((id: string) => ({ employeeId: id })),
      },
    },
    include: {
      participants: {
        include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  });

  return NextResponse.json({ room }, { status: 201 });
  } catch (err) {
    console.error("[chat/rooms POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
