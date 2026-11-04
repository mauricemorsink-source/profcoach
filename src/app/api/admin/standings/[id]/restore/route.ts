import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { id } = await params;
  const target = await prisma.standingsPublication.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  // Terugdraaien = een NIEUWE publicatie met de oude data, meteen zichtbaar. De oorspronkelijke
  // rij (en alles wat er sindsdien bij kwam) blijft gewoon in de geschiedenis staan.
  const restored = await prisma.standingsPublication.create({
    data: {
      seasonId: target.seasonId,
      label: `Hersteld: ${target.label ?? new Date(target.revealAt).toLocaleDateString("nl-NL")}`,
      data: target.data as object,
      matchesAsOf: target.matchesAsOf,
      revealAt: new Date(),
      createdById: session.userId,
    },
  });

  return NextResponse.json(restored);
}
