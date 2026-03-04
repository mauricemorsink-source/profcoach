import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { matchId } = await params;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  const { performances } = await req.json() as {
    performances: {
      playerId: string;
      played: boolean;
      goals: number;
      penaltyGoals: number;
      assists: number;
      ownGoals: number;
      yellowCards: number;
      redCard: boolean;
    }[];
  };

  for (const p of performances) {
    await prisma.matchPerformance.upsert({
      where: { matchId_playerId: { matchId, playerId: p.playerId } },
      update: {
        played: p.played,
        goals: p.goals,
        penaltyGoals: p.penaltyGoals,
        assists: p.assists,
        ownGoals: p.ownGoals,
        yellowCards: p.yellowCards,
        redCard: p.redCard,
      },
      create: {
        matchId,
        playerId: p.playerId,
        played: p.played,
        goals: p.goals,
        penaltyGoals: p.penaltyGoals,
        assists: p.assists,
        ownGoals: p.ownGoals,
        yellowCards: p.yellowCards,
        redCard: p.redCard,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
