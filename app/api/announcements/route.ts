import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { sendEmail, emailLayout } from "@/lib/email";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const announcements = await db.announcement.findMany({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("[ANNOUNCEMENTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["HR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    if (!data.title || !data.content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const announcement = await db.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority ?? "NORMAL",
        targetRole: data.targetRole ?? null,
        createdBy: session.user.email,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    // Notify employees by email — fire and forget
    db.employee.findMany({
      where: {
        status: "ACTIVE",
        ...(data.targetRole ? { user: { role: data.targetRole } } : {}),
      },
      select: { firstName: true, email: true },
    }).then((employees) => {
      Promise.allSettled(
        employees.map((emp) =>
          sendEmail({
            to: [{ email: emp.email, name: emp.firstName }],
            subject: `📢 ${announcement.title}`,
            htmlContent: emailLayout(
              announcement.title,
              `<p>Hi ${emp.firstName},</p>
               <p>${announcement.content}</p>
               <a href="https://hr.orbilox.com/announcements" style="display:inline-block; margin-top:16px; background:#4f46e5; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600;">View Announcements</a>`
            ),
          })
        )
      );
    }).catch((err) => console.error("Failed to send announcement emails:", err));

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("[ANNOUNCEMENTS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
