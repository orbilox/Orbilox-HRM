import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";

// Runs every Saturday at 10:45 AM IST (05:15 UTC) — vercel.json cron
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Send to all active employees with EMPLOYEE role (interns)
  const users = await db.user.findMany({
    where: { role: "EMPLOYEE", employee: { status: "ACTIVE" } },
    include: { employee: { select: { firstName: true, email: true } } },
  });

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    const emp = user.employee;
    if (!emp?.email) { failed++; continue; }

    const result = await sendEmail({
      to: [{ email: emp.email, name: emp.firstName }],
      subject: "📋 Saturday Assignment Reminder — Starts at 11:00 AM",
      htmlContent: emailLayout(
        "Saturday Assignment Session Today!",
        `<p>Hi ${emp.firstName},</p>
         <p>Good morning! Just a reminder that today's <strong>Saturday Assignment Session</strong> is starting soon. Make sure you are prepared with your tasks and materials.</p>
         <div style="margin: 24px 0; background: #fdf4ff; border-left: 4px solid #9333ea; border-radius: 8px; padding: 16px 20px;">
           <p style="margin:0; font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Session Timing</p>
           <p style="margin:6px 0 0; font-size:22px; font-weight:800; color:#9333ea;">11:00 AM – 5:00 PM</p>
         </div>
         <p>Your assignment will be reviewed by your manager at the end of the session. Make the most of it — every task brings you closer to your goals! 🚀</p>
         <p>You can find your tasks on the <strong>Orbilox LMS</strong> portal under your enrolled courses.</p>
         <a href="https://hr.orbilox.com/lms" style="display:inline-block; margin-top:20px; background:#9333ea; color:#fff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:700; font-size:15px;">Open My Learning Courses →</a>
         <p style="margin-top:24px; color:#6b7280; font-size:13px;">All the best for today's session! 💪</p>`
      ),
    }).catch(() => ({ error: true }));

    if ("error" in result) { failed++; } else { sent++; }
  }

  console.log(`[CRON saturday-assignment] sent=${sent} failed=${failed} total=${users.length}`);
  return NextResponse.json({ sent, failed, total: users.length });
}
