import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { KYC_DOCS } from "@/lib/kyc-config";
import { sendEmail, emailLayout } from "@/lib/email";

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

  // Notify employee of document verification result
  if (doc.employeeId) {
    const emp = await db.employee.findUnique({ where: { id: doc.employeeId }, select: { firstName: true, email: true } });
    if (emp?.email) {
      const isVerified = action === "VERIFY";
      await sendEmail({
        to: [{ email: emp.email, name: emp.firstName }],
        subject: `${isVerified ? "✅" : "❌"} KYC Document ${isVerified ? "Verified" : "Rejected"} — ${doc.label}`,
        htmlContent: emailLayout(`Document ${isVerified ? "Verified" : "Rejected"}`, `
          <p>Hi ${emp.firstName},</p>
          <p>Your KYC document has been <strong style="color:${isVerified ? "#059669" : "#dc2626"};">${isVerified ? "verified" : "rejected"}</strong> by our HR team.</p>
          <table style="width:100%;margin:20px 0;border-collapse:collapse;border-radius:8px;overflow:hidden;">
            <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;width:40%;">Document</td><td style="padding:10px 14px;font-weight:700;color:#111827;">${doc.label}</td></tr>
            <tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Status</td><td style="padding:10px 14px;font-weight:700;color:${isVerified ? "#059669" : "#dc2626"};">${isVerified ? "Verified ✅" : "Rejected ❌"}</td></tr>
            ${!isVerified && doc.rejectionReason ? `<tr style="background:#fef2f2;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Reason</td><td style="padding:10px 14px;color:#dc2626;">${doc.rejectionReason}</td></tr>` : ""}
          </table>
          ${!isVerified ? `<p>Please log in and resubmit the correct document at the earliest.</p>` : `<p>Your document is now on record. Thank you for completing your KYC! 🎉</p>`}
          <a href="https://hr.orbilox.com/kyc" style="display:inline-block;margin-top:16px;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Go to My KYC →</a>
        `),
      }).catch(() => null);
    }
  }

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
