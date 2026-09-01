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
  if (config.processed) return NextResponse.json({ error: "Bonuspunten al verwerkt. Trek eerst in." }, { status: 400 });

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json({ error: "Geen actief seizoen" }, { status: 400 });

  // Snapshot prevBonusPoints voor alle TeamEntries van dit seizoen, zodat de bonus die
  // hierna wordt toegekend één keer als delta in de tussenstand opvalt en daarna gewoon
  // settelt in het totaal (net als prevPoints/prevCaptainPoints bij matchverwerking).
  await prisma.$executeRaw`
    UPDATE "TeamEntry"
    SET "prevBonusPoints" = "bonusPoints"
    WHERE "seasonId" = ${season.id}
  `;

  const predictions = await prisma.teamPrediction.findMany({
    where: { teamEntry: { seasonId: season.id } },
    include: { teamEntry: true },
  });

  let processed = 0;
  for (const pred of predictions) {
    const bonus = calculatePredictionBonus(config, pred);
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
