import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { sendEmail, emailLayout } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employees = await db.employee.findMany({
      include: { department: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("[EMPLOYEES_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();

    // Generate employee code
    const count = await db.employee.count();
    const employeeCode = `EMP${String(count + 1).padStart(4, "0")}`;

    const employee = await db.employee.create({
      data: {
        employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pinCode: data.pinCode || null,
        designation: data.designation || null,
        departmentId: data.departmentId || null,
        managerId: data.managerId || null,
        employmentType: data.employmentType || "FULL_TIME",
        workLocation: data.workLocation || null,
        joiningDate: new Date(data.joiningDate),
        status: data.status || "ACTIVE",
        basicSalary: parseFloat(data.basicSalary) || 0,
        hra: parseFloat(data.hra) || 0,
        da: parseFloat(data.da) || 0,
        ta: parseFloat(data.ta) || 0,
        otherAllowance: parseFloat(data.otherAllowance) || 0,
        pfEmployee: parseFloat(data.pfEmployee) || 0,
        pfEmployer: parseFloat(data.pfEmployer) || 0,
        esiEmployee: parseFloat(data.esiEmployee) || 0,
        esiEmployer: parseFloat(data.esiEmployer) || 0,
        professionalTax: parseFloat(data.professionalTax) || 0,
        bankAccount: data.bankAccount || null,
        bankName: data.bankName || null,
        ifscCode: data.ifscCode || null,
        panNumber: data.panNumber || null,
        aadharNumber: data.aadharNumber || null,
      },
    });

    // Create user login account if requested
    if (data.createAccount !== false) {
      const loginEmail = (data.loginEmail || employee.email).trim();
      const loginPassword = data.loginPassword || "Welcome@123";
      const loginRole = data.loginRole || "EMPLOYEE";
      const hashedPassword = await bcrypt.hash(loginPassword, 10);
      const createdUser = await db.user
        .create({
          data: {
            email: loginEmail,
            password: hashedPassword,
            role: loginRole,
            employeeId: employee.id,
          },
        })
        .catch(() => null); // ignore if user already exists

      // Notify the new employee with their login credentials — fire and forget
      if (createdUser) {
        sendEmail({
          to: [{ email: employee.email, name: employee.firstName }],
          subject: "Welcome to Orbilox — Your account is ready",
          htmlContent: emailLayout(
            "Welcome to Orbilox HRM",
            `<p>Hi ${employee.firstName},</p>
             <p>Welcome aboard! HR has set up your employee profile and portal login. Use the credentials below to sign in:</p>
             <table style="width:100%; margin: 16px 0; border-collapse: collapse;">
               <tr><td style="padding:8px 0; color:#6b7280;">Login Email</td><td style="padding:8px 0; font-weight:600; color:#111827;">${loginEmail}</td></tr>
               <tr><td style="padding:8px 0; color:#6b7280;">Temporary Password</td><td style="padding:8px 0; font-weight:600; color:#111827;">${loginPassword}</td></tr>
               <tr><td style="padding:8px 0; color:#6b7280;">Role</td><td style="padding:8px 0; font-weight:600; color:#111827;">${loginRole}</td></tr>
             </table>
             <p>For security, please log in and change your password as soon as possible.</p>
             <a href="https://hr.orbilox.com/login" style="display:inline-block; margin-top:16px; background:#4f46e5; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600;">Log In to Orbilox</a>`
          ),
        }).catch((err) => console.error("Failed to send new-employee welcome email:", err));
      }
    }

    return NextResponse.json(employee, { status: 201 });
  } catch (error: unknown) {
    console.error("[EMPLOYEES_POST]", error);
    const msg = (error as { code?: string; meta?: { target?: string[] } })?.code === "P2002"
      ? `A record with this ${(error as { meta?: { target?: string[] } })?.meta?.target?.join(", ")} already exists`
      : "Failed to create employee";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
