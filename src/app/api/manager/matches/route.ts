import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getManagerAuthContext } from "@/lib/managerAuth";

export async function GET(req: NextRequest) {
  const auth = await getManagerAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  const { team } = auth;

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json([]);

  const matches = await prisma.match.findMany({
    where: { clubTeam: team as any, seasonId: season.id },
    orderBy: { matchDate: "desc" },
    include: { _count: { select: { performances: true } } },
  });

  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  const auth = await getManagerAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  const { team, session } = auth;

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });

  const body = await req.json();
  const { name, homeAway, matchDate, goalsScored, goalsConceded, extraScorers, notes } = body;

  if (!name?.trim() || !matchDate) {
    return NextResponse.json({ error: "Naam en datum zijn verplicht" }, { status: 400 });
  }
  const scored = goalsScored != null ? Number(goalsScored) : 0;
  const conceded = goalsConceded != null ? Number(goalsConceded) : 0;
  if (!Number.isInteger(scored) || scored < 0 || !Number.isInteger(conceded) || conceded < 0) {
    return NextResponse.json({ error: "Doelpunten moeten positieve gehele getallen zijn" }, { status: 400 });
  }

  const match = await prisma.match.create({
    data: {
      seasonId: season.id,
      clubTeam: team as any,
      name: name.trim(),
      homeAway: homeAway ?? "HOME",
      matchDate: new Date(matchDate),
      goalsScored: scored,
      goalsConceded: conceded,
      extraScorers: extraScorers?.length ? extraScorers : null,
      notes: notes?.trim() || null,
      status: "PENDING",
      createdById: session?.userId ?? null,
    },
  });

  return NextResponse.json(match, { status: 201 });
}
