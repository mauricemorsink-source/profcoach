import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function getEffectiveTeam(session: { role: string; managedTeam?: string | null }, req: NextRequest): string | null {
  if (session.managedTeam) return session.managedTeam;
  if (session.role === "ADMIN") return req.nextUrl.searchParams.get("adminTeam");
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "MANAGER" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const team = getEffectiveTeam(session, req);
  if (!team) return NextResponse.json({ error: "Geen elftal toegewezen" }, { status: 403 });

  const { matchId } = await params;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.clubTeam !== team) {
    return NextResponse.json({ error: "Wedstrijd niet gevonden" }, { status: 404 });
  }

  // Haal eigen spelers op
  const ownPlayers = await prisma.player.findMany({
    where: { clubTeam: team as any, active: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });

  // Haal alle opgeslagen prestaties op
  const performances = await prisma.matchPerformance.findMany({
    where: { matchId },
    include: { player: { select: { name: true, position: true, clubTeam: true } } },
  });

  const perfMap = new Map(performances.map((p) => [p.playerId, p]));
  const ownPlayerIds = new Set(ownPlayers.map((p) => p.id));

  // Eigen spelers (met opgeslagen prestatie of standaard nullen)
  const ownPerfs = ownPlayers.map((p) => {
    const perf = perfMap.get(p.id);
    return {
      playerId: p.id,
      playerName: p.name,
      position: p.position,
      clubTeam: p.clubTeam,
      isGuest: false,
      played: perf?.played ?? false,
      goals: perf?.goals ?? 0,
      penaltyGoals: perf?.penaltyGoals ?? 0,
      assists: perf?.assists ?? 0,
      ownGoals: perf?.ownGoals ?? 0,
      yellowCards: perf?.yellowCards ?? 0,
      redCard: perf?.redCard ?? false,
    };
  });

  // Gastspelers: opgeslagen prestaties voor spelers NIET in eigen elftal
  const guestPerfs = performances
    .filter((p) => !ownPlayerIds.has(p.playerId))
    .map((p) => ({
      playerId: p.playerId,
      playerName: p.player.name,
      position: p.player.position,
      clubTeam: p.player.clubTeam,
      isGuest: true,
      played: p.played,
      goals: p.goals,
      penaltyGoals: p.penaltyGoals,
      assists: p.assists,
      ownGoals: p.ownGoals,
      yellowCards: p.yellowCards,
      redCard: p.redCard,
    }));

  return NextResponse.json({
    match,
    players: ownPlayers,
    performances: [...ownPerfs, ...guestPerfs],
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "MANAGER" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const team = getEffectiveTeam(session, req);
  if (!team) return NextResponse.json({ error: "Geen elftal toegewezen" }, { status: 403 });

  const { matchId } = await params;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.clubTeam !== team) {
    return NextResponse.json({ error: "Wedstrijd niet gevonden" }, { status: 404 });
  }

  if (match.status !== "PENDING") {
    return NextResponse.json({ error: "Alleen ingediende wedstrijden kunnen worden bewerkt" }, { status: 400 });
  }

  const body = await req.json();
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      name: body.name?.trim() ?? match.name,
      homeAway: body.homeAway ?? match.homeAway,
      matchDate: body.matchDate ? new Date(body.matchDate) : match.matchDate,
      goalsScored: body.goalsScored !== undefined ? Number(body.goalsScored) : match.goalsScored,
      goalsConceded: body.goalsConceded !== undefined ? Number(body.goalsConceded) : match.goalsConceded,
    },
  });

  return NextResponse.json(updated);
}
