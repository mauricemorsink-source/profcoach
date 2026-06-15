import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateMatchPoints, buildConfigMap } from "@/lib/points";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ momentId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { momentId } = await params;

  const [approvedMatches, configs] = await Promise.all([
    prisma.match.findMany({
      where: { publishMomentId: momentId, status: "APPROVED" },
      include: {
        performances: {
          where: { played: true },
          include: {
            player: { select: { name: true, position: true, clubTeam: true, altTeam: true } },
          },
        },
      },
    }),
    prisma.pointsConfig.findMany(),
  ]);

  const configMap = buildConfigMap(configs);

  type ConflictMatch = {
    matchId: string;
    matchName: string;
    matchDate: string;
    matchClubTeam: string;
    isOriginalTeam: boolean;
    goals: number;
    penaltyGoals: number;
    assists: number;
    ownGoals: number;
    yellowCards: number;
    redCard: boolean;
    points: number;
  };

  const playerMatchMap = new Map<
    string,
    {
      player: { name: string; position: string; clubTeam: string; altTeam: string | null };
      matches: ConflictMatch[];
    }
  >();

  for (const match of approvedMatches) {
    const pointsMap = calculateMatchPoints(match, configMap);

    for (const perf of match.performances) {
      const isOriginalTeam = match.clubTeam === perf.player.clubTeam;
      const delta = pointsMap.get(perf.playerId);
      const existing = playerMatchMap.get(perf.playerId);
      const entry: ConflictMatch = {
        matchId: match.id,
        matchName: match.name,
        matchDate: match.matchDate.toISOString(),
        matchClubTeam: match.clubTeam,
        isOriginalTeam,
        goals: perf.goals,
        penaltyGoals: perf.penaltyGoals,
        assists: perf.assists,
        ownGoals: perf.ownGoals,
        yellowCards: perf.yellowCards,
        redCard: perf.redCard,
        points: delta?.points ?? 0,
      };
      if (existing) {
        existing.matches.push(entry);
      } else {
        playerMatchMap.set(perf.playerId, {
          player: {
            name: perf.player.name,
            position: perf.player.position,
            clubTeam: perf.player.clubTeam,
            altTeam: perf.player.altTeam,
          },
          matches: [entry],
        });
      }
    }
  }

  const conflicts = [];
  for (const [playerId, data] of playerMatchMap) {
    if (data.matches.length >= 2) {
      conflicts.push({ playerId, ...data });
    }
  }

  return NextResponse.json(conflicts);
}
