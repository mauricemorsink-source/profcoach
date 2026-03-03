import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const validPositions = ["GK", "DEF", "MID", "ATT"];
const validTeams = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];

export async function GET() {
  const players = await prisma.player.findMany({
    where: { active: true },
    orderBy: [{ clubTeam: "asc" }, { position: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(players);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, shortName, position, clubTeam, value } = body;

  if (!name?.trim() || !position || !clubTeam || value === undefined) {
    return NextResponse.json({ error: "Alle velden zijn verplicht" }, { status: 400 });
  }
  if (!validPositions.includes(position)) {
    return NextResponse.json({ error: "Ongeldige positie" }, { status: 400 });
  }
  if (!validTeams.includes(clubTeam)) {
    return NextResponse.json({ error: "Ongeldig team" }, { status: 400 });
  }
  const numValue = Number(value);
  if (isNaN(numValue) || numValue <= 0) {
    return NextResponse.json({ error: "Ongeldige waarde" }, { status: 400 });
  }

  const duplicate = await prisma.player.findFirst({
    where: {
      name: name.trim(),
      clubTeam: clubTeam,
      position: position,
      value: numValue,
      active: true,
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Een speler met deze combinatie (naam, elftal, positie, waarde) bestaat al" },
      { status: 409 }
    );
  }

  const player = await prisma.player.create({
    data: {
      name: name.trim(),
      shortName: shortName?.trim() || null,
      position: position,
      clubTeam: clubTeam,
      value: numValue,
      active: true,
    },
  });

  return NextResponse.json(player, { status: 201 });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { ids } = body as { ids: string[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Geen spelers opgegeven" }, { status: 400 });
  }

  await prisma.player.updateMany({
    where: { id: { in: ids } },
    data: { active: false },
  });

  return NextResponse.json({ deleted: ids.length });
}
