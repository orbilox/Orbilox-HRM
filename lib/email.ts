const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

type SendEmailParams = {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
};

export async function sendEmail({ to, subject, htmlContent }: SendEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("BREVO_API_KEY not set — skipping email send");
    return { skipped: true };
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL || "itcrewindia@gmail.com",
        name: process.env.BREVO_SENDER_NAME || "Orbilox HRM",
      },
      to,
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Brevo email send failed:", res.status, errText);
    return { error: true, status: res.status };
  }

  return { success: true };
}

export function emailLayout(title: string, bodyHtml: string) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f8fafc; padding: 32px 16px;">
    <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom: 24px;">
        <div style="width:32px;height:32px;background:#4f46e5;border-radius:8px;"></div>
        <span style="font-size:18px; font-weight:700; color:#111827;">Orbilox</span>
      </div>
      <h2 style="color:#111827; font-size: 20px; margin: 0 0 16px;">${title}</h2>
      <div style="color:#374151; font-size: 14px; line-height: 1.6;">
        ${bodyHtml}
      </div>
      <hr style="border:none; border-top:1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color:#9ca3af; font-size: 12px; margin:0;">This is an automated notification from Orbilox HRM. Please do not reply to this email.</p>
    </div>
  </div>`;
}
