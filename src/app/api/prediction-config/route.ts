import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — only exposes what participants need to see
export async function GET() {
  const config = await prisma.predictionConfig.findUnique({ where: { id: "singleton" } });
  if (!config) return NextResponse.json({ showPointsToParticipants: false, topScorerPoints: 5, assistKoningPoints: 5, yellowCardsPoints: 5 });
  return NextResponse.json({
    showPointsToParticipants: config.showPointsToParticipants,
    topScorerPoints: config.topScorerPoints,
    assistKoningPoints: config.assistKoningPoints,
    yellowCardsPoints: config.yellowCardsPoints,
  });
}
