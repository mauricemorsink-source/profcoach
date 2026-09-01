import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { computeDeelnemersStandings } from "@/lib/standings";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { revealAt, label } = body as { revealAt?: string; label?: string };

  let revealAtDate = new Date();
  if (revealAt) {
    const parsed = new Date(revealAt);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Ongeldige datum" }, { status: 400 });
    }
    revealAtDate = parsed;
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) {
    return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });
  }

  const [standings, settings] = await Promise.all([
    computeDeelnemersStandings(season.id),
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const publication = await prisma.standingsPublication.create({
    data: {
      seasonId: season.id,
      label: label?.trim() || null,
      data: standings,
      matchesAsOf: settings?.standingsUpdatedAt ?? null,
      revealAt: revealAtDate,
      createdById: session.userId,
    },
  });

  return NextResponse.json(publication);
}
