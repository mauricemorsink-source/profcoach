import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildConfigMap, applyMatchPointsToSeason, applyAutoExcludableGuestPerformances, findGuestDoubleAppearances } from "@/lib/points";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  // Optioneel: alleen specifieke wedstrijden verwerken, en/of eerder door de admin opgeloste
  // ambigue gastspeler-conflicten (welke wedstrijd telt mee per speler).
  let selectedIds: string[] | null = null;
  let excludedPerformances: { matchId: string; playerId: string }[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.matchIds) && body.matchIds.length > 0) {
      selectedIds = body.matchIds as string[];
    }
    if (Array.isArray(body?.excludedPerformances)) {
      excludedPerformances = body.excludedPerformances;
    }
  } catch {
    // No body or invalid JSON → process all, geen conflicten opgelost
  }
  const excludedSet = new Set(excludedPerformances.map((e) => `${e.matchId}:${e.playerId}`));

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

    const approvedMatches = await prisma.match.findMany({
      where: approvedWhere,
      include: { performances: { include: { player: { select: { name: true, position: true, clubTeam: true } } } } },
    });

    if (approvedMatches.length === 0) {
      await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
      return NextResponse.json({ processed: 0, playersUpdated: 0 });
    }

    // Ambigue gastspeler-conflicten (twee optredens dezelfde dag, geen van beide het eigen
    // elftal) kunnen niet automatisch opgelost worden — de admin moet zelf kiezen welke
    // wedstrijd telt. Zolang niet voor ELKE ambigue speler een keuze is doorgegeven, wordt er
    // helemaal niets verwerkt (geen enkele wedstrijd uit deze batch, ook niet de rest).
    const appearances = findGuestDoubleAppearances(approvedMatches, configMap);
    const unresolved = appearances.filter(
      (a) => a.ambiguous && !a.matches.some((m) => excludedSet.has(`${m.matchId}:${a.playerId}`))
    );
    if (unresolved.length > 0) {
      await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
      return NextResponse.json({ error: "conflicts", conflicts: unresolved }, { status: 409 });
    }

    // Pas de door de admin opgeloste ambigue conflicten toe (in-memory zodat calculateMatchPoints
    // hierna de juiste waarde ziet, en in de database voor consistentie bij terugdraaien/TOTW).
    if (excludedSet.size > 0) {
      for (const match of approvedMatches) {
        for (const perf of match.performances) {
          if (excludedSet.has(`${match.id}:${perf.playerId}`)) perf.isExcluded = true;
        }
      }
      await prisma.matchPerformance.updateMany({
        where: { OR: excludedPerformances.map((e) => ({ matchId: e.matchId, playerId: e.playerId })) },
        data: { isExcluded: true },
      });
    }

    // De rest (eenduidige gastspeler-conflicten) automatisch oplossen: eigen elftal telt.
    await applyAutoExcludableGuestPerformances(approvedMatches, configMap);

    const playersUpdated = await applyMatchPointsToSeason(
      season.id,
      configMap,
      [{ matches: approvedMatches, factor: 1 }],
      settings?.captainEnabled ? { enabled: true, pointsPerWin: settings.captainBonusPerWin ?? 5 } : null
    );

    await prisma.match.updateMany({
      where: { id: { in: approvedMatches.map((m) => m.id) } },
      data: { status: "PROCESSED", processedAt: new Date() },
    });

    await prisma.gameSettings.update({
      where: { id: "singleton" },
      data: { standingsUpdatedAt: new Date(), isProcessing: false },
    });

    return NextResponse.json({
      processed: approvedMatches.length,
      playersUpdated,
    });
  } catch (error) {
    await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
    console.error("process-points error:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden" }, { status: 500 });
  }
}
