import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ momentId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { momentId } = await params;

  const approvedMatches = await prisma.match.findMany({
    where: { publishMomentId: momentId, status: "APPROVED" },
    include: {
      performances: {
        where: { played: true },
        include: {
          player: { select: { name: true, position: true, clubTeam: true, altTeam: true } },
        },
      },
    },
  });

  type ConflictMatch = {
    matchId: string;
    matchName: string;
    matchClubTeam: string;
    isOriginalTeam: boolean;
  };

  const playerMatchMap = new Map<
    string,
    {
      player: { name: string; position: string; clubTeam: string; altTeam: string | null };
      matches: ConflictMatch[];
    }
  >();

  for (const match of approvedMatches) {
    for (const perf of match.performances) {
      const isOriginalTeam = match.clubTeam === perf.player.clubTeam;
      const existing = playerMatchMap.get(perf.playerId);
      const entry: ConflictMatch = {
        matchId: match.id,
        matchName: match.name,
        matchClubTeam: match.clubTeam,
        isOriginalTeam,
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
