import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculatePredictionBonus } from "@/lib/predictionBonus";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const config = await prisma.predictionConfig.findUnique({ where: { id: "singleton" } });
  if (!config) return NextResponse.json({ error: "Geen bonusconfiguratie gevonden" }, { status: 400 });
  if (!config.processed) return NextResponse.json({ error: "Bonuspunten nog niet verwerkt" }, { status: 400 });

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json({ error: "Geen actief seizoen" }, { status: 400 });

  // Trek exact terug wat "process" ooit heeft toegekend — niet blind naar 0 resetten,
  // want bonusPoints kan ook los daarvan handmatig zijn aangepast door een admin
  // (via de deelnemers- of team-entry-beheerpagina), en dat mag hier niet verdwijnen.
  const predictions = await prisma.teamPrediction.findMany({
    where: { teamEntry: { seasonId: season.id } },
  });

  for (const pred of predictions) {
    const bonus = calculatePredictionBonus(config, pred);
    if (bonus > 0) {
      await prisma.teamEntry.update({
        where: { id: pred.teamEntryId },
        data: { bonusPoints: { decrement: bonus } },
      });
    }
  }

  await prisma.predictionConfig.update({
    where: { id: "singleton" },
    data: { processed: false, processedAt: null },
  });

  return NextResponse.json({ ok: true });
}
