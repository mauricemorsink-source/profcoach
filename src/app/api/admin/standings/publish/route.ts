import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { computeDeelnemersStandings } from "@/lib/standings";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) {
    return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });
  }

  const standings = await computeDeelnemersStandings(season.id);
  const publishedStandingsAt = new Date();

  await prisma.gameSettings.update({
    where: { id: "singleton" },
    data: { publishedStandingsAt, publishedStandingsData: standings },
  });

  return NextResponse.json({ publishedStandingsAt, count: standings.length });
}
