import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { computeDeelnemersStandings, computeTopStats, getVisibleStandingsPublication, type PublishedStandingsData } from "@/lib/standings";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { label } = body as { label?: string };

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) {
    return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });
  }

  // Delta's altijd t.o.v. de vorige publicatie (niet de laatste verwerkronde) — anders raakt de
  // groei tussen twee publicaties zoek zodra er tussentijds meerdere keren verwerkt is.
  const previous = await getVisibleStandingsPublication(season.id);
  const prevData = previous?.data as PublishedStandingsData | undefined;

  const [deelnemers, stats, settings] = await Promise.all([
    computeDeelnemersStandings(season.id, prevData?.deelnemers),
    computeTopStats(season.id, prevData?.stats),
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const revealAt = new Date();

  const publication = await prisma.standingsPublication.create({
    data: {
      seasonId: season.id,
      label: label?.trim() || null,
      data: { deelnemers, stats },
      matchesAsOf: settings?.standingsUpdatedAt ?? null,
      revealAt,
      createdById: session.userId,
    },
  });

  return NextResponse.json(publication);
}
