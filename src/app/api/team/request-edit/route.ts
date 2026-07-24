import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEditLink } from "@/lib/email";
import { randomBytes } from "crypto";
import { rateLimit, getIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const { ok, retryAfterSec } = rateLimit(`edit-request:${getIp(req)}`, { max: 3, windowMs: 60 * 60 * 1000 });
  if (!ok) {
    return NextResponse.json({ error: "Te veel aanvragen. Probeer het over een uur opnieuw." }, {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    });
  }

  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-mailadres vereist" }, { status: 400 });
  }

  const settings = await prisma.gameSettings.findUnique({
    where: { id: "singleton" },
    select: { wijzigingsvensterOpen: true },
  });

  if (!settings?.wijzigingsvensterOpen) {
    return NextResponse.json(
      { error: "Het wijzigingsvenster is momenteel gesloten." },
      { status: 403 }
    );
  }

  // Find the most recent TeamEntry for this email
  const entry = await prisma.teamEntry.findFirst({
    where: { email: email.toLowerCase().trim() },
    orderBy: { createdAt: "desc" },
    select: { id: true, voornaam: true, email: true },
  });

  // Always return success to avoid exposing which emails are registered
  if (!entry) {
    return NextResponse.json({ ok: true });
  }

  // Invalidate any existing unused tokens for this entry
  await prisma.editToken.deleteMany({
    where: { teamEntryId: entry.id, usedAt: null },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await prisma.editToken.create({
    data: { token, teamEntryId: entry.id, expiresAt },
  });

  await sendEditLink(
    entry.email!,
    entry.voornaam ?? "deelnemer",
    token
  );

  return NextResponse.json({ ok: true });
}
