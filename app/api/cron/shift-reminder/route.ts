import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";

// Runs daily at 7:15 PM IST (13:45 UTC) — vercel.json cron
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all active employees with an email
  const employees = await db.employee.findMany({
    where: { status: "ACTIVE", email: { not: "" } },
    select: { firstName: true, email: true },
  });

  let sent = 0;
  let failed = 0;

  for (const emp of employees) {
    const result = await sendEmail({
      to: [{ email: emp.email, name: emp.firstName }],
      subject: "⏰ Shift Reminder — Starting at 7:30 PM Tonight",
      htmlContent: emailLayout(
        "Your Shift Starts Soon!",
        `<p>Hi ${emp.firstName},</p>
         <p>This is a friendly reminder that your shift is starting soon. Please make sure you are ready and logged in on time.</p>
         <div style="margin: 24px 0; background: #f0f4ff; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 16px 20px;">
           <p style="margin:0; font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Shift Timing</p>
           <p style="margin:6px 0 0; font-size:22px; font-weight:800; color:#4f46e5;">7:30 PM – 8:30 PM</p>
         </div>
         <p>Please be present and ready 5 minutes before your shift begins. If you have any issues, contact your manager immediately.</p>
         <p style="color:#6b7280; font-size:13px;">Best of luck with your shift! 💪</p>`
      ),
    }).catch(() => ({ error: true }));

    if ("error" in result) { failed++; } else { sent++; }
  }

  console.log(`[CRON shift-reminder] sent=${sent} failed=${failed} total=${employees.length}`);
  return NextResponse.json({ sent, failed, total: employees.length });
}
