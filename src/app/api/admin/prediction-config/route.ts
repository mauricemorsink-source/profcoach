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
  return NextResponse.json(config ?? {});
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }
  const body = await req.json();
  const {
    topScorerId, assistKoningId,
    yellowCardsMin, yellowCardsMax,
    totalGoalsMin, totalGoalsMax,
    topScorerPoints, assistKoningPoints, yellowCardsPoints, totalGoalsPoints,
    showPointsToParticipants,
  } = body;

  const config = await prisma.predictionConfig.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      topScorerId: topScorerId || null,
      assistKoningId: assistKoningId || null,
      yellowCardsMin: yellowCardsMin != null ? Number(yellowCardsMin) : null,
      yellowCardsMax: yellowCardsMax != null ? Number(yellowCardsMax) : null,
      totalGoalsMin: totalGoalsMin != null ? Number(totalGoalsMin) : null,
      totalGoalsMax: totalGoalsMax != null ? Number(totalGoalsMax) : null,
      topScorerPoints: Number(topScorerPoints) || 5,
      assistKoningPoints: Number(assistKoningPoints) || 5,
      yellowCardsPoints: Number(yellowCardsPoints) || 5,
      totalGoalsPoints: Number(totalGoalsPoints) || 5,
      showPointsToParticipants: Boolean(showPointsToParticipants),
    },
    update: {
      topScorerId: topScorerId || null,
      assistKoningId: assistKoningId || null,
      yellowCardsMin: yellowCardsMin != null ? Number(yellowCardsMin) : null,
      yellowCardsMax: yellowCardsMax != null ? Number(yellowCardsMax) : null,
      totalGoalsMin: totalGoalsMin != null ? Number(totalGoalsMin) : null,
      totalGoalsMax: totalGoalsMax != null ? Number(totalGoalsMax) : null,
      topScorerPoints: Number(topScorerPoints) || 5,
      assistKoningPoints: Number(assistKoningPoints) || 5,
      yellowCardsPoints: Number(yellowCardsPoints) || 5,
      totalGoalsPoints: Number(totalGoalsPoints) || 5,
      showPointsToParticipants: Boolean(showPointsToParticipants),
    },
    include: {
      topScorer: { select: { id: true, name: true } },
      assistKoning: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(config);
}
