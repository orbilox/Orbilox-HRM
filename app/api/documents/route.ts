import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { sendEmail, emailLayout } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const docs = await db.document.findMany({
    where: employeeId ? { employeeId } : undefined,
    include: { employee: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = await req.json();
    const doc = await db.document.create({
      data: {
        employeeId: data.employeeId,
        name: data.name,
        type: data.type,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize ?? null,
        mimeType: data.mimeType ?? null,
        uploadedBy: session.user.email,
      },
    });

    // Notify employee that a document was uploaded for them
    if (data.employeeId) {
      const emp = await db.employee.findUnique({ where: { id: data.employeeId }, select: { firstName: true, email: true } });
      if (emp?.email) {
        await sendEmail({
          to: [{ email: emp.email, name: emp.firstName }],
          subject: `📄 New Document Added — ${data.name}`,
          htmlContent: emailLayout("New Document Available", `
            <p>Hi ${emp.firstName},</p>
            <p>A new document has been added to your profile on the Orbilox HRM portal.</p>
            <table style="width:100%;margin:20px 0;border-collapse:collapse;border-radius:8px;overflow:hidden;">
              <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;width:40%;">Document Name</td><td style="padding:10px 14px;font-weight:700;color:#4f46e5;">${data.name}</td></tr>
              <tr style="background:#fff;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Type</td><td style="padding:10px 14px;color:#111827;">${data.type}</td></tr>
              <tr style="background:#f3f4f6;"><td style="padding:10px 14px;color:#6b7280;font-size:13px;">Uploaded By</td><td style="padding:10px 14px;color:#111827;">${session.user.email}</td></tr>
            </table>
            <p>You can view and download it from the Documents section of your portal.</p>
            <a href="https://hr.orbilox.com/documents" style="display:inline-block;margin-top:16px;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">View My Documents →</a>
          `),
        }).catch(() => null);
      }
    }

    return NextResponse.json(doc, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
