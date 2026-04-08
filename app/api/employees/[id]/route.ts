import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const employee = await db.employee.findUnique({
      where: { id },
      include: { department: true, manager: true },
    });

    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    return NextResponse.json(employee);
  } catch (error) {
    console.error("[EMPLOYEE_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const data = await req.json();

    const employee = await db.employee.update({
      where: { id },
      data: {
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
        employmentType: data.employmentType,
        workLocation: data.workLocation || null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
        status: data.status,
        basicSalary: data.basicSalary !== undefined ? parseFloat(data.basicSalary) : undefined,
        hra: data.hra !== undefined ? parseFloat(data.hra) : undefined,
        da: data.da !== undefined ? parseFloat(data.da) : undefined,
        ta: data.ta !== undefined ? parseFloat(data.ta) : undefined,
        otherAllowance: data.otherAllowance !== undefined ? parseFloat(data.otherAllowance) : undefined,
        pfEmployee: data.pfEmployee !== undefined ? parseFloat(data.pfEmployee) : undefined,
        pfEmployer: data.pfEmployer !== undefined ? parseFloat(data.pfEmployer) : undefined,
        esiEmployee: data.esiEmployee !== undefined ? parseFloat(data.esiEmployee) : undefined,
        esiEmployer: data.esiEmployer !== undefined ? parseFloat(data.esiEmployer) : undefined,
        professionalTax: data.professionalTax !== undefined ? parseFloat(data.professionalTax) : undefined,
        bankAccount: data.bankAccount || null,
        bankName: data.bankName || null,
        ifscCode: data.ifscCode || null,
        panNumber: data.panNumber || null,
        aadharNumber: data.aadharNumber || null,
      },
      include: { department: true },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("[EMPLOYEE_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    await db.employee.delete({ where: { id } });
    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("[EMPLOYEE_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
