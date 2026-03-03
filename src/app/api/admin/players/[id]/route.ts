import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const validPositions = ["GK", "DEF", "MID", "ATT"];
const validTeams = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
      NOT: { id },
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Een speler met deze combinatie (naam, elftal, positie, waarde) bestaat al" },
      { status: 409 }
    );
  }

  try {
    const player = await prisma.player.update({
      where: { id },
      data: {
        name: name.trim(),
        shortName: shortName?.trim() || null,
        position: position,
        clubTeam: clubTeam,
        value: numValue,
      },
    });
    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ error: "Speler niet gevonden" }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.player.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Speler niet gevonden" }, { status: 404 });
  }
}
