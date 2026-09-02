import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculatePredictionBonusBreakdown } from "@/lib/predictionBonus";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json([]);

  const [entries, predictionConfig] = await Promise.all([
    prisma.teamEntry.findMany({
      where: { seasonId: season.id },
      orderBy: { createdAt: "asc" },
      include: {
        formation: true,
        players: {
          include: { player: true },
          orderBy: { slotIndex: "asc" },
        },
        prediction: {
          include: {
            topScorer: { select: { id: true, name: true } },
            assistKoning: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.predictionConfig.findUnique({ where: { id: "singleton" } }),
  ]);

  const playerIds = [...new Set(entries.flatMap((e) => e.players.map((p) => p.playerId)))];
  const seasonStats = await prisma.playerSeasonStats.findMany({
    where: { seasonId: season.id, playerId: { in: playerIds } },
    select: { playerId: true, totalPoints: true },
  });
  const pointsByPlayerId = new Map(seasonStats.map((s) => [s.playerId, s.totalPoints]));

  // Alleen een zinvolle breakdown tonen als de bonusvragen daadwerkelijk verwerkt zijn —
  // anders staat er nog geen "correct antwoord" vast om tegen te vergelijken.
  const result = entries.map((entry) => ({
    ...entry,
    players: entry.players.map((tp) => ({ ...tp, totalPoints: pointsByPlayerId.get(tp.playerId) ?? 0 })),
    predictionBonusBreakdown:
      predictionConfig?.processed && entry.prediction
        ? calculatePredictionBonusBreakdown(predictionConfig, entry.prediction)
        : null,
  }));

  return NextResponse.json(result);
}
