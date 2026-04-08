import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

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

    // Auto-create user account
    if (data.createAccount !== false) {
      const hashedPassword = await bcrypt.hash("Welcome@123", 10);
      await db.user
        .create({
          data: {
            email: employee.email,
            password: hashedPassword,
            role: "EMPLOYEE",
            employeeId: employee.id,
          },
        })
        .catch(() => {}); // ignore if user already exists
    }

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("[EMPLOYEES_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
