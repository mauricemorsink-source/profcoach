import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { findGuestDoubleAppearances } from "@/lib/points";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  let selectedIds: string[] | null = null;
  try {
    const body = await req.json();
    if (Array.isArray(body?.matchIds) && body.matchIds.length > 0) {
      selectedIds = body.matchIds as string[];
    }
  } catch {
    // No body or invalid JSON → preview all
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) {
    return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });
  }

  const approvedWhere = selectedIds
    ? { status: "APPROVED" as const, seasonId: season.id, id: { in: selectedIds } }
    : { status: "APPROVED" as const, seasonId: season.id };

  const approvedMatches = await prisma.match.findMany({
    where: approvedWhere,
    include: { performances: { include: { player: { select: { name: true, position: true, clubTeam: true } } } } },
  });

  const appearances = findGuestDoubleAppearances(approvedMatches);
  return NextResponse.json({ appearances });
}
