import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  computeDeelnemersStandings,
  computeTopStats,
  getVisibleStandingsPublication,
  type PublishedStandingsData,
  type StandingsScope,
} from "@/lib/standings";

const SCOPES: StandingsScope[] = ["BOTH", "STAND", "STATISTIEKEN"];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { label, scope = "BOTH" } = body as { label?: string; scope?: StandingsScope };
  if (!SCOPES.includes(scope)) {
    return NextResponse.json({ error: "Ongeldig onderdeel" }, { status: 400 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) {
    return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });
  }

  // Delta's altijd t.o.v. de vorige publicatie van hetzelfde onderdeel (niet de laatste
  // verwerkronde) — anders raakt de groei tussen twee publicaties zoek zodra er tussentijds
  // meerdere keren verwerkt is, of zodra stand en statistieken los van elkaar gepubliceerd worden.
  const [prevStandPub, prevStatsPub] = await Promise.all([
    getVisibleStandingsPublication(season.id, "STAND"),
    getVisibleStandingsPublication(season.id, "STATISTIEKEN"),
  ]);
  const prevDeelnemers = (prevStandPub?.data as PublishedStandingsData | undefined)?.deelnemers;
  const prevStats = (prevStatsPub?.data as PublishedStandingsData | undefined)?.stats;

  const includeStand = scope !== "STATISTIEKEN";
  const includeStats = scope !== "STAND";

  const [deelnemers, stats, settings] = await Promise.all([
    includeStand ? computeDeelnemersStandings(season.id, prevDeelnemers) : undefined,
    includeStats ? computeTopStats(season.id, prevStats) : undefined,
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const data: PublishedStandingsData = {};
  if (deelnemers) data.deelnemers = deelnemers;
  if (stats) data.stats = stats;

  const revealAt = new Date();

  const publication = await prisma.standingsPublication.create({
    data: {
      seasonId: season.id,
      label: label?.trim() || null,
      scope,
      data,
      matchesAsOf: settings?.standingsUpdatedAt ?? null,
      revealAt,
      createdById: session.userId,
    },
  });

  return NextResponse.json(publication);
}
