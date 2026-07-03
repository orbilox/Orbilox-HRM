import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { sendEmail, emailLayout } from "@/lib/email";

export async function POST() {
  const session = await auth();
  if (!session || !["ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const TEMP_PASSWORD = "Welcome@123";
  const hashed = await bcrypt.hash(TEMP_PASSWORD, 10);

  // Fetch all users linked to an employee
  const users = await db.user.findMany({
    where: { employeeId: { not: null } },
    include: {
      employee: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    const employeeEmail = user.employee?.email;
    if (!employeeEmail) { failed++; continue; }

    // Reset password so the employee has a known credential
    await db.user.update({ where: { id: user.id }, data: { password: hashed } });

    const result = await sendEmail({
      to: [{ email: employeeEmail, name: user.employee?.firstName ?? "" }],
      subject: "🎉 Welcome to Orbilox HRM — Your Login is Ready!",
      htmlContent: emailLayout(
        `Welcome to Orbilox, ${user.employee?.firstName ?? ""}! 🎉`,
        `<p>Hi ${user.employee?.firstName ?? ""},</p>
         <p>Congratulations and a warm welcome to the <strong>Orbilox</strong> family! 🎊 We're thrilled to have you on board.</p>
         <p>Your Orbilox HRM portal account is set up and ready. Use the credentials below to sign in and get started:</p>
         <table style="width:100%; margin: 20px 0; border-collapse: collapse; border-radius:8px; overflow:hidden;">
           <tr style="background:#f3f4f6;">
             <td style="padding:12px 16px; color:#6b7280; font-size:13px; width:40%;">Login Email</td>
             <td style="padding:12px 16px; font-weight:700; color:#111827; font-size:14px;">${user.email}</td>
           </tr>
           <tr style="background:#fff;">
             <td style="padding:12px 16px; color:#6b7280; font-size:13px;">Temporary Password</td>
             <td style="padding:12px 16px; font-weight:700; color:#4f46e5; font-size:14px;">${TEMP_PASSWORD}</td>
           </tr>
           <tr style="background:#f3f4f6;">
             <td style="padding:12px 16px; color:#6b7280; font-size:13px;">Role</td>
             <td style="padding:12px 16px; font-weight:700; color:#111827; font-size:14px;">${user.role}</td>
           </tr>
         </table>
         <p style="color:#ef4444; font-size:13px;">⚠️ For your security, please log in and change your password immediately.</p>
         <p>Through the HRM portal you can view your payslips, apply for leaves, check announcements, access your learning courses, and much more.</p>
         <a href="https://hr.orbilox.com/login" style="display:inline-block; margin-top:20px; background:#4f46e5; color:#fff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:700; font-size:15px;">Log In to Orbilox HRM →</a>
         <p style="margin-top:24px; color:#6b7280; font-size:13px;">Welcome aboard — we're excited to have you with us! 🚀</p>`
      ),
    }).catch(() => ({ error: true }));

    if ("error" in result) { failed++; } else { sent++; }
  }

  return NextResponse.json({ sent, failed, total: users.length });
}
