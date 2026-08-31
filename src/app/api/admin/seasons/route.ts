import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const seasons = await prisma.season.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { teamEntries: true, matches: true } },
    },
  });

  return NextResponse.json(seasons);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  const { name } = body;
  if (!name?.trim()) {
    return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
  }

  const existing = await prisma.season.findFirst({ where: { name: name.trim() } });
  if (existing) {
    return NextResponse.json({ error: "Er bestaat al een seizoen met deze naam" }, { status: 409 });
  }

  const season = await prisma.$transaction(async (tx) => {
    await tx.season.updateMany({ where: { isActive: true }, data: { isActive: false } });
    return tx.season.create({ data: { name: name.trim(), isActive: true } });
  });

  // Nieuw seizoen = schone lei voor de spelinstellingen die niet aan een seizoen
  // gekoppeld zijn (GameSettings is een singleton, niet seizoensgebonden).
  await prisma.gameSettings.update({
    where: { id: "singleton" },
    data: {
      deadline: null,
      registrationOpen: false,
      wijzigingsvensterOpen: false,
      standingsUpdatedAt: null,
      isProcessing: false,
    },
  });

  return NextResponse.json(season, { status: 201 });
}
