import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// KYC document config — required doc types
export const KYC_DOCS = [
  { docType: "PHOTO",         label: "Profile Photo",         isRequired: true,  hasNumber: false },
  { docType: "AADHAAR",       label: "Aadhaar Card",          isRequired: true,  hasNumber: true,  numberLabel: "Aadhaar Number (12 digits)" },
  { docType: "PAN",           label: "PAN Card",              isRequired: true,  hasNumber: true,  numberLabel: "PAN Number" },
  { docType: "BANK",          label: "Bank / Cancelled Cheque",isRequired: true, hasNumber: true,  numberLabel: "Bank Account Number" },
  { docType: "ADDRESS_PROOF", label: "Address Proof",         isRequired: true,  hasNumber: false },
  { docType: "PASSPORT",      label: "Passport",              isRequired: false, hasNumber: true,  numberLabel: "Passport Number" },
  { docType: "EDUCATION",     label: "Highest Qualification Certificate", isRequired: false, hasNumber: false },
  { docType: "EXPERIENCE",    label: "Previous Employment Certificate",   isRequired: false, hasNumber: false },
];

// GET — fetch KYC profile + docs for the current employee (or a specific one for admins)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetEmployeeId = searchParams.get("employeeId");

  const isAdmin = ["ADMIN", "HR", "MANAGER"].includes(session.user.role ?? "");
  const employeeId = isAdmin && targetEmployeeId ? targetEmployeeId : session.user.employeeId;

  if (!employeeId) return NextResponse.json({ error: "No employee linked" }, { status: 400 });

  const [profile, documents] = await Promise.all([
    db.kYCProfile.findUnique({ where: { employeeId } }),
    db.kYCDocument.findMany({ where: { employeeId }, orderBy: { docType: "asc" } }),
  ]);

  return NextResponse.json({ profile, documents, docConfig: KYC_DOCS });
}

// POST — save/update a single KYC document (employee saves their own)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employeeId = session.user.employeeId;
  if (!employeeId) return NextResponse.json({ error: "No employee linked" }, { status: 400 });

  const body = await req.json();
  const { docType, label, docNumber, fileUrl, fileName, isRequired } = body;

  if (!docType || !label) return NextResponse.json({ error: "docType and label are required" }, { status: 400 });

  // Upsert the document record
  const doc = await db.kYCDocument.upsert({
    where: { employeeId_docType: { employeeId, docType } },
    create: {
      employeeId, docType, label,
      docNumber: docNumber || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      isRequired: isRequired ?? true,
      status: "SUBMITTED",
    },
    update: {
      docNumber: docNumber || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      status: "SUBMITTED",
      rejectionReason: null, // clear rejection on re-submit
    },
  });

  // Recalculate profile completion
  await recalcKYCProfile(employeeId);

  return NextResponse.json({ doc });
}

// PATCH — admin reviews a single document (verify / reject)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["ADMIN", "HR", "MANAGER"].includes(session.user.role ?? "");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { docId, action, rejectionReason, employeeId, profileAction, remarks } = body;

  // Profile-level approve / reject
  if (profileAction && employeeId) {
    const updated = await db.kYCProfile.upsert({
      where: { employeeId },
      create: {
        employeeId,
        status: profileAction === "APPROVE" ? "APPROVED" : "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: session.user.name ?? session.user.email ?? "Admin",
        remarks: remarks || null,
        completionPct: profileAction === "APPROVE" ? 100 : 0,
        submittedAt: new Date(),
      },
      update: {
        status: profileAction === "APPROVE" ? "APPROVED" : "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: session.user.name ?? session.user.email ?? "Admin",
        remarks: remarks || null,
      },
    });
    return NextResponse.json({ profile: updated });
  }

  // Document-level verify / reject
  if (!docId || !action) return NextResponse.json({ error: "docId and action required" }, { status: 400 });

  const doc = await db.kYCDocument.update({
    where: { id: docId },
    data: {
      status: action === "VERIFY" ? "VERIFIED" : "REJECTED",
      verifiedBy: session.user.name ?? session.user.email ?? "Admin",
      verifiedAt: new Date(),
      rejectionReason: action === "REJECT" ? (rejectionReason || "Document rejected") : null,
    },
  });

  // Recalc profile after doc change
  if (doc.employeeId) await recalcKYCProfile(doc.employeeId);

  return NextResponse.json({ doc });
}

// Helper — recalculate overall KYC profile status
async function recalcKYCProfile(employeeId: string) {
  const docs = await db.kYCDocument.findMany({ where: { employeeId } });
  const requiredDocs = KYC_DOCS.filter((d) => d.isRequired);
  const submittedRequired = docs.filter((d) => d.isRequired && d.status !== "PENDING");
  const completionPct = Math.round((submittedRequired.length / requiredDocs.length) * 100);

  const hasRejected = docs.some((d) => d.status === "REJECTED");
  const allVerified = requiredDocs.every((rd) =>
    docs.find((d) => d.docType === rd.docType)?.status === "VERIFIED"
  );

  let status = "IN_PROGRESS";
  if (completionPct === 0) status = "NOT_STARTED";
  else if (allVerified) status = "APPROVED";
  else if (hasRejected) status = "REJECTED";
  else if (completionPct === 100) status = "SUBMITTED";

  await db.kYCProfile.upsert({
    where: { employeeId },
    create: { employeeId, status, completionPct, submittedAt: completionPct === 100 ? new Date() : null },
    update: {
      completionPct,
      status,
      ...(completionPct === 100 ? { submittedAt: new Date() } : {}),
    },
  });
}
