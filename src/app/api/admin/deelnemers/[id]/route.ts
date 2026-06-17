import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { voornaam, achternaam, email, telefoonnummer, whatsappGroep, betaald, bonusPoints } = body;

  const entry = await prisma.teamEntry.update({
    where: { id },
    data: {
      ...(voornaam !== undefined && { voornaam: voornaam || null }),
      ...(achternaam !== undefined && { achternaam: achternaam || null }),
      ...(email !== undefined && { email: email || null }),
      ...(telefoonnummer !== undefined && { telefoonnummer: telefoonnummer || null }),
      ...(whatsappGroep !== undefined && { whatsappGroep: Boolean(whatsappGroep) }),
      ...(betaald !== undefined && { betaald: Boolean(betaald) }),
      ...(bonusPoints !== undefined && { bonusPoints: Number(bonusPoints) || 0 }),
    },
  });

  return NextResponse.json(entry);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.$transaction([
    prisma.teamEntryPlayer.deleteMany({ where: { teamEntryId: id } }),
    prisma.teamEntry.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
