import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "ProfCoach <onboarding@resend.dev>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEditLink(to: string, naam: string, token: string) {
  const link = `${BASE_URL}/team-aanpassen/${token}`;
  const safeNaam = escapeHtml(naam);

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Pas jouw ProfCoach-team aan",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#06b6d4;margin-bottom:8px">ProfCoach – Team aanpassen</h2>
        <p>Hoi ${safeNaam},</p>
        <p>Klik op de knop hieronder om jouw team aan te passen. De link is <strong>48 uur geldig</strong> en kan maar één keer gebruikt worden.</p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#0891b2;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
          Mijn team aanpassen
        </a>
        <p style="color:#6b7280;font-size:13px">Of kopieer deze link:<br/><span style="color:#06b6d4">${link}</span></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px">Heb jij dit niet aangevraagd? Dan kun je deze mail negeren.</p>
      </div>
    `,
  });
}
