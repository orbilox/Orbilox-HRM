import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employeeId = (session.user as any).employeeId;
    if (!employeeId) {
      return NextResponse.json({ error: "No employee linked to this account" }, { status: 400 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Find today's attendance record
    const existingRecord = await db.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    if (!existingRecord) {
      // No record today — create one with check-in
      const attendance = await db.attendance.create({
        data: {
          employeeId,
          date: todayStart,
          checkIn: now,
          status: "PRESENT",
        },
      });
      return NextResponse.json({ action: "checked_in", attendance }, { status: 201 });
    }

    if (!existingRecord.checkOut) {
      // Record exists but no check-out yet — do check-out and calculate hours worked
      const checkInTime = existingRecord.checkIn ? new Date(existingRecord.checkIn) : now;
      const diffMs = now.getTime() - checkInTime.getTime();
      const hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

      const attendance = await db.attendance.update({
        where: { id: existingRecord.id },
        data: {
          checkOut: now,
          hoursWorked,
        },
      });
      return NextResponse.json({ action: "checked_out", attendance });
    }

    // Already checked in and checked out
    return NextResponse.json(
      { error: "Already checked in and checked out for today" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[ATTENDANCE_CHECKIN_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
