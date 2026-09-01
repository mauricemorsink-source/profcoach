import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { id } = await params;
  const publication = await prisma.standingsPublication.findUnique({ where: { id } });
  if (!publication) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  // Alleen een nog niet bereikte (geplande) publicatie mag geannuleerd worden — een publicatie
  // die al zichtbaar is geweest voor deelnemers blijft staan als geschiedenis (gebruik "Herstel"
  // op een andere versie om terug te draaien, niet verwijderen).
  if (publication.revealAt <= new Date()) {
    return NextResponse.json({ error: "Deze publicatie is al zichtbaar geweest en kan niet verwijderd worden" }, { status: 400 });
  }

  await prisma.standingsPublication.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
