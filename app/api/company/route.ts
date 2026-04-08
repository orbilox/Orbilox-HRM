import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const company = await db.company.findFirst();
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    return NextResponse.json(company);
  } catch (error) {
    console.error("[COMPANY_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const existing = await db.company.findFirst();

    const payload = {
      name: data.name ?? "My Company",
      logo: data.logo ?? null,
      industry: data.industry ?? null,
      website: data.website ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      country: data.country ?? "India",
      pinCode: data.pinCode ?? null,
      gstin: data.gstin ?? null,
      pan: data.pan ?? null,
      cin: data.cin ?? null,
      foundedYear: data.foundedYear ? parseInt(data.foundedYear) : null,
    };

    const company = existing
      ? await db.company.update({ where: { id: existing.id }, data: payload })
      : await db.company.create({ data: payload });

    return NextResponse.json(company);
  } catch (error) {
    console.error("[COMPANY_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
