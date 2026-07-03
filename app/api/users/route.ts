import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { sendEmail, emailLayout } from "@/lib/email";

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
      include: { employee: { select: { firstName: true, email: true } } },
    });

    // Notify the employee with their new login credentials
    const notifyEmail = user.employee?.email ?? user.email;
    await sendEmail({
      to: [{ email: notifyEmail, name: user.employee?.firstName ?? "" }],
      subject: "Your Orbilox HRM login has been created",
      htmlContent: emailLayout(
        "Welcome to Orbilox HRM",
        `<p>Hi ${user.employee?.firstName ?? ""},</p>
         <p>HR has created a login for you on the Orbilox HRM portal. Use the credentials below to sign in:</p>
         <table style="width:100%; margin: 16px 0; border-collapse: collapse;">
           <tr><td style="padding:8px 0; color:#6b7280;">Login Email</td><td style="padding:8px 0; font-weight:600; color:#111827;">${user.email}</td></tr>
           <tr><td style="padding:8px 0; color:#6b7280;">Temporary Password</td><td style="padding:8px 0; font-weight:600; color:#111827;">${data.password}</td></tr>
           <tr><td style="padding:8px 0; color:#6b7280;">Role</td><td style="padding:8px 0; font-weight:600; color:#111827;">${user.role}</td></tr>
         </table>
         <p>For security, please log in and change your password as soon as possible.</p>
         <a href="https://hr.orbilox.com/login" style="display:inline-block; margin-top:16px; background:#4f46e5; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600;">Log In to Orbilox</a>`
      ),
    }).catch((err) => console.error("Failed to send login welcome email:", err));

    return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
