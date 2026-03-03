import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "MANAGER" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const team = session.managedTeam || (session.role === "ADMIN" ? req.nextUrl.searchParams.get("adminTeam") : null);
  if (!team) return NextResponse.json({ error: "Geen elftal toegewezen" }, { status: 403 });

  const { matchId } = await params;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Wedstrijd niet gevonden" }, { status: 404 });
  if (match.clubTeam !== team) {
    return NextResponse.json({ error: "Geen toegang tot deze wedstrijd" }, { status: 403 });
  }
  if (match.status !== "PENDING") {
    return NextResponse.json({ error: "Prestaties kunnen alleen bij ingediende wedstrijden worden gewijzigd" }, { status: 400 });
  }

  const body = await req.json();
  const { performances } = body as {
    performances: Array<{
      playerId: string;
      played: boolean;
      goals: number;
      penaltyGoals: number;
      assists: number;
      ownGoals: number;
      yellowCards: number;
      redCard: boolean;
    }>;
  };

  if (!Array.isArray(performances)) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  for (const perf of performances) {
    await prisma.matchPerformance.upsert({
      where: { matchId_playerId: { matchId, playerId: perf.playerId } },
      create: {
        matchId,
        playerId: perf.playerId,
        played: perf.played ?? false,
        goals: perf.goals ?? 0,
        penaltyGoals: perf.penaltyGoals ?? 0,
        assists: perf.assists ?? 0,
        ownGoals: perf.ownGoals ?? 0,
        yellowCards: perf.yellowCards ?? 0,
        redCard: perf.redCard ?? false,
      },
      update: {
        played: perf.played ?? false,
        goals: perf.goals ?? 0,
        penaltyGoals: perf.penaltyGoals ?? 0,
        assists: perf.assists ?? 0,
        ownGoals: perf.ownGoals ?? 0,
        yellowCards: perf.yellowCards ?? 0,
        redCard: perf.redCard ?? false,
      },
    });
  }

  return NextResponse.json({ saved: performances.length });
}
