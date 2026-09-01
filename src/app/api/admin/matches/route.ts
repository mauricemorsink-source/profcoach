import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildConfigMap, applyMatchPointsToSeason } from "@/lib/points";
import type { MatchStatus } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const matches = await prisma.match.findMany({
    orderBy: { matchDate: "desc" },
    include: {
      createdBy: { select: { name: true, email: true } },
      publishMoment: { select: { id: true, label: true, scheduledAt: true, publishedAt: true } },
      performances: {
        include: { player: { select: { name: true, position: true, clubTeam: true } } },
        orderBy: { player: { name: "asc" } },
      },
    },
  });

  return NextResponse.json(matches);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  const { ids, status } = body as { ids: string[]; status: string };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Geen wedstrijden opgegeven" }, { status: 400 });
  }
  if (status !== "APPROVED" && status !== "REJECTED") {
    return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
  }
  const newStatus: MatchStatus = status;

  // PROCESSED wedstrijden slaan we over: die status ligt vast en kan niet meer via
  // een bulk-actie gewijzigd worden (zelfde regel als de losse PATCH per wedstrijd).
  const targets = await prisma.match.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true },
  });
  const updatableIds = targets.filter((m) => m.status !== "PROCESSED").map((m) => m.id);

  if (updatableIds.length > 0) {
    await prisma.match.updateMany({ where: { id: { in: updatableIds } }, data: { status: newStatus } });
  }

  return NextResponse.json({ updated: updatableIds.length, skipped: targets.length - updatableIds.length });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  const { ids } = body as { ids: string[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Geen wedstrijden opgegeven" }, { status: 400 });
  }

  const targets = await prisma.match.findMany({
    where: { id: { in: ids } },
    include: { performances: { include: { player: { select: { position: true } } } } },
  });

  if (targets.length === 0) {
    return NextResponse.json({ deleted: 0, playersReverted: 0 });
  }

  // PROCESSED wedstrijden: punten meteen terugdraaien voordat ze verdwijnen. Hergebruikt
  // dezelfde snapshot-logica als het normale verwerken (nu met factor -1), zodat
  // prevPoints/prevCaptainPoints kloppen en het delta-pijltje niet scheeftrekt.
  const needsReversal = targets.filter((m) => m.status === "PROCESSED");
  let playersReverted = 0;

  if (needsReversal.length > 0) {
    const season = await prisma.season.findFirst({ where: { isActive: true } });
    if (!season) return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });

    const configs = await prisma.pointsConfig.findMany();
    const configMap = buildConfigMap(configs);
    const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
    const captainBonus = settings ? { enabled: settings.captainEnabled, pointsPerWin: settings.captainBonusPerWin } : null;

    playersReverted = await applyMatchPointsToSeason(season.id, configMap, [{ matches: needsReversal, factor: -1 }], captainBonus);

    await prisma.gameSettings.update({ where: { id: "singleton" }, data: { standingsUpdatedAt: new Date() } });
  }

  // Altijd hard delete: geen tussenstatus meer die punten kan "kwijtraken"
  const allIds = targets.map((m) => m.id);
  await prisma.matchPerformance.deleteMany({ where: { matchId: { in: allIds } } });
  await prisma.match.deleteMany({ where: { id: { in: allIds } } });

  return NextResponse.json({ deleted: allIds.length, playersReverted });
}
