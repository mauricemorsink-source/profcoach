import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { teamEntryId } = await req.json();

  const team = await prisma.teamEntry.findUnique({ where: { id: teamEntryId } });
  if (!team) return NextResponse.json({ error: "Team niet gevonden" }, { status: 404 });
  if (team.userId !== session.userId) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  // Controleer deadline — terugtrekken mag niet na de deadline
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  if (settings?.deadline && new Date() > new Date(settings.deadline)) {
    return NextResponse.json({ error: "Terugtrekken is niet meer mogelijk na de deadline" }, { status: 403 });
  }

  const unlocked = await prisma.teamEntry.update({
    where: { id: teamEntryId },
    data: { locked: false },
  });

  return NextResponse.json({ team: unlocked });
}
