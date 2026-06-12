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
  if (!config.processed) return NextResponse.json({ error: "Bonuspunten nog niet verwerkt" }, { status: 400 });

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json({ error: "Geen actief seizoen" }, { status: 400 });

  // Reset all bonus points in active season
  await prisma.teamEntry.updateMany({
    where: { seasonId: season.id },
    data: { bonusPoints: 0 },
  });

  await prisma.predictionConfig.update({
    where: { id: "singleton" },
    data: { processed: false, processedAt: null },
  });

  return NextResponse.json({ ok: true });
}
