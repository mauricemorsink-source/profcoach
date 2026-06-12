import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const config = await prisma.predictionConfig.findUnique({ where: { id: "singleton" } });
  if (!config) return NextResponse.json({ error: "Geen bonusconfiguratie gevonden" }, { status: 400 });
  if (config.processed) return NextResponse.json({ error: "Bonuspunten al verwerkt. Trek eerst in." }, { status: 400 });

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json({ error: "Geen actief seizoen" }, { status: 400 });

  const predictions = await prisma.teamPrediction.findMany({
    where: { teamEntry: { seasonId: season.id } },
    include: { teamEntry: true },
  });

  let processed = 0;
  for (const pred of predictions) {
    let bonus = 0;
    if (config.topScorerId && pred.topScorerId === config.topScorerId) bonus += config.topScorerPoints;
    if (config.assistKoningId && pred.assistKoningId === config.assistKoningId) bonus += config.assistKoningPoints;
    if (
      pred.totalYellowCards != null &&
      config.yellowCardsMin != null &&
      config.yellowCardsMax != null &&
      pred.totalYellowCards >= config.yellowCardsMin &&
      pred.totalYellowCards <= config.yellowCardsMax
    ) {
      bonus += config.yellowCardsPoints;
    }
    if (
      pred.totalGoals != null &&
      config.totalGoalsMin != null &&
      config.totalGoalsMax != null &&
      pred.totalGoals >= config.totalGoalsMin &&
      pred.totalGoals <= config.totalGoalsMax
    ) {
      bonus += config.totalGoalsPoints;
    }
    if (bonus > 0) {
      await prisma.teamEntry.update({
        where: { id: pred.teamEntryId },
        data: { bonusPoints: { increment: bonus } },
      });
      processed++;
    }
  }

  await prisma.predictionConfig.update({
    where: { id: "singleton" },
    data: { processed: true, processedAt: new Date() },
  });

  return NextResponse.json({ ok: true, processed, total: predictions.length });
}
