import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildConfigMap, applyMatchPointsToSeason } from "@/lib/points";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  // Optional: only process specific match IDs
  let selectedIds: string[] | null = null;
  try {
    const body = await req.json();
    if (Array.isArray(body?.matchIds) && body.matchIds.length > 0) {
      selectedIds = body.matchIds as string[];
    }
  } catch {
    // No body or invalid JSON → process all
  }

  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  if (settings?.isProcessing) {
    return NextResponse.json({ error: "Verwerking is al bezig, probeer het later opnieuw" }, { status: 409 });
  }

  await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: true } });

  try {
    const season = await prisma.season.findFirst({ where: { isActive: true } });
    if (!season) {
      await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
      return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });
    }

    const configs = await prisma.pointsConfig.findMany();
    const configMap = buildConfigMap(configs);

    const approvedWhere = selectedIds
      ? { status: "APPROVED" as const, seasonId: season.id, id: { in: selectedIds } }
      : { status: "APPROVED" as const, seasonId: season.id };

    const correctionWhere = selectedIds
      ? { status: "CORRECTION" as const, seasonId: season.id, id: { in: selectedIds } }
      : { status: "CORRECTION" as const, seasonId: season.id };

    const approvedMatches = await prisma.match.findMany({
      where: approvedWhere,
      include: { performances: { include: { player: { select: { position: true } } } } },
    });

    const correctionMatches = await prisma.match.findMany({
      where: correctionWhere,
      include: { performances: { include: { player: { select: { position: true } } } } },
    });

    if (approvedMatches.length === 0 && correctionMatches.length === 0) {
      await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
      return NextResponse.json({ processed: 0, reversed: 0, playersUpdated: 0 });
    }

    const playersUpdated = await applyMatchPointsToSeason(
      season.id,
      configMap,
      [
        { matches: approvedMatches, factor: 1 },
        { matches: correctionMatches, factor: -1 },
      ],
      settings?.captainEnabled ? { enabled: true, pointsPerWin: settings.captainBonusPerWin ?? 5 } : null
    );

    // APPROVED → PROCESSED
    if (approvedMatches.length > 0) {
      await prisma.match.updateMany({
        where: { id: { in: approvedMatches.map((m) => m.id) } },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
    }

    // CORRECTION → hard delete
    for (const match of correctionMatches) {
      await prisma.matchPerformance.deleteMany({ where: { matchId: match.id } });
      await prisma.match.delete({ where: { id: match.id } });
    }

    await prisma.gameSettings.update({
      where: { id: "singleton" },
      data: { standingsUpdatedAt: new Date(), isProcessing: false },
    });

    return NextResponse.json({
      processed: approvedMatches.length,
      reversed: correctionMatches.length,
      playersUpdated,
    });
  } catch (error) {
    await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
    console.error("process-points error:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden" }, { status: 500 });
  }
}
