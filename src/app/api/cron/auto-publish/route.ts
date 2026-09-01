import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildConfigMap, applyMatchPointsToSeason, applyAutoExcludableGuestPerformances } from "@/lib/points";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overdueMoments = await prisma.publishMoment.findMany({
    where: { scheduledAt: { lte: new Date() }, publishedAt: null },
  });

  if (overdueMoments.length === 0) {
    return NextResponse.json({ processed: 0, playersUpdated: 0 });
  }

  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  if (settings?.isProcessing) {
    return NextResponse.json({ error: "Already processing" }, { status: 409 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) {
    return NextResponse.json({ error: "Geen actief seizoen" }, { status: 400 });
  }

  await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: true } });

  let totalProcessed = 0;
  let totalPlayers = 0;

  try {
    const configs = await prisma.pointsConfig.findMany();
    const configMap = buildConfigMap(configs);
    const captainBonus = settings?.captainEnabled
      ? { enabled: true, pointsPerWin: settings.captainBonusPerWin ?? 5 }
      : null;

    for (const moment of overdueMoments) {
      const approvedMatches = await prisma.match.findMany({
        where: { publishMomentId: moment.id, status: "APPROVED", seasonId: season.id },
        include: { performances: { include: { player: { select: { position: true, clubTeam: true } } } } },
      });

      // Gastspeler bij twee elftallen in dezelfde ronde: hier draait geen admin mee, dus
      // pas de eigen-elftal-voorrangsregel automatisch toe voordat de punten berekend worden.
      await applyAutoExcludableGuestPerformances(approvedMatches);

      const playersUpdated = await applyMatchPointsToSeason(
        season.id,
        configMap,
        [{ matches: approvedMatches, factor: 1 }],
        captainBonus
      );

      if (approvedMatches.length > 0) {
        await prisma.match.updateMany({
          where: { id: { in: approvedMatches.map((m) => m.id) } },
          data: { status: "PROCESSED", processedAt: new Date() },
        });
      }

      await prisma.publishMoment.update({
        where: { id: moment.id },
        data: { publishedAt: new Date() },
      });

      totalProcessed += approvedMatches.length;
      totalPlayers += playersUpdated;
    }

    await prisma.gameSettings.update({
      where: { id: "singleton" },
      data: { standingsUpdatedAt: new Date(), isProcessing: false },
    });

    return NextResponse.json({
      moments: overdueMoments.length,
      processed: totalProcessed,
      playersUpdated: totalPlayers,
    });
  } catch (error) {
    await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
    console.error("auto-publish cron error:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden" }, { status: 500 });
  }
}
