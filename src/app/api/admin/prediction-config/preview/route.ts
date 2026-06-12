import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const config = await prisma.predictionConfig.findUnique({
    where: { id: "singleton" },
    include: {
      topScorer: { select: { id: true, name: true } },
      assistKoning: { select: { id: true, name: true } },
    },
  });
  if (!config) return NextResponse.json({ error: "Geen configuratie" }, { status: 400 });

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json({ error: "Geen actief seizoen" }, { status: 400 });

  const predictions = await prisma.teamPrediction.findMany({
    where: { teamEntry: { seasonId: season.id } },
  });

  const total = predictions.length;

  const topScorerCount = config.topScorerId
    ? predictions.filter(p => p.topScorerId === config.topScorerId).length
    : null;

  const assistKoningCount = config.assistKoningId
    ? predictions.filter(p => p.assistKoningId === config.assistKoningId).length
    : null;

  const yellowCardsCount = config.yellowCardsMin != null && config.yellowCardsMax != null
    ? predictions.filter(p =>
        p.totalYellowCards != null &&
        p.totalYellowCards >= config.yellowCardsMin! &&
        p.totalYellowCards <= config.yellowCardsMax!
      ).length
    : null;

  const totalGoalsCount = config.totalGoalsMin != null && config.totalGoalsMax != null
    ? predictions.filter(p =>
        p.totalGoals != null &&
        p.totalGoals >= config.totalGoalsMin! &&
        p.totalGoals <= config.totalGoalsMax!
      ).length
    : null;

  return NextResponse.json({
    config,
    total,
    topScorerCount,
    assistKoningCount,
    yellowCardsCount,
    totalGoalsCount,
  });
}
