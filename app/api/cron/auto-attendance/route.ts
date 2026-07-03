import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Runs Mon–Fri at 16:00 UTC (9:30 PM IST) — after the last check-in window closes
// Simulates attendance for all non-intern employees (ADMIN, HR, MANAGER roles)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Midnight UTC of today — used as the date key for attendance records
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // All active employees linked to non-intern user accounts
  const employees = await db.employee.findMany({
    where: {
      status: "ACTIVE",
      user: { role: { in: ["ADMIN", "HR", "MANAGER"] } },
    },
    select: { id: true },
  });

  let created = 0;
  let skipped = 0;

  for (const emp of employees) {
    // Random check-in: 7:15 PM – 8:45 PM IST = 13:45 – 15:15 UTC (825–915 min from midnight UTC)
    const checkInOffsetMin = 13 * 60 + 45 + Math.floor(Math.random() * 91); // 825 to 915
    const checkIn = new Date(today.getTime() + checkInOffsetMin * 60 * 1000);

    // Checkout: 8 hours after check-in ± random within ±22 minutes (45-minute total window)
    const checkoutVarianceMin = Math.floor(Math.random() * 45) - 22; // -22 to +22
    const checkOut = new Date(checkIn.getTime() + (8 * 60 + checkoutVarianceMin) * 60 * 1000);

    const hoursWorked = parseFloat(
      ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2)
    );

    try {
      await db.attendance.upsert({
        where: { employeeId_date: { employeeId: emp.id, date: today } },
        create: {
          employeeId: emp.id,
          date: today,
          checkIn,
          checkOut,
          status: "PRESENT",
          hoursWorked,
          notes: "Auto-recorded",
        },
        update: {}, // don't overwrite if already exists (e.g. manually checked in)
      });
      created++;
    } catch {
      skipped++;
    }
  }

  console.log(`[CRON auto-attendance] created=${created} skipped=${skipped} total=${employees.length}`);
  return NextResponse.json({ created, skipped, total: employees.length, date: today });
}
