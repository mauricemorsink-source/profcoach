import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { teamEntryId, topScorerId, assistKoningId, totalYellowCards, totalGoals } = await req.json();

  const team = await prisma.teamEntry.findUnique({
    where: { id: teamEntryId },
    include: { prediction: true },
  });
  if (!team) return NextResponse.json({ error: "Team niet gevonden" }, { status: 404 });
  if (!team.locked) return NextResponse.json({ error: "Team moet eerst ingediend zijn" }, { status: 400 });

  if (team.userId !== null) {
    const session = await getSession();
    if (!session || session.userId !== team.userId) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }
  }

  if (team.prediction) {
    return NextResponse.json({ error: "Voorspellingen al ingediend" }, { status: 400 });
  }

  // Zelfde deadline als teaminschrijving: een voorspelling die pas later in het seizoen
  // wordt ingevuld (bv. als iemand zijn team wel op tijd indient maar de voorspelling
  // openlaat) zou oneerlijk voordeel geven t.o.v. wie meteen blind gokt.
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" }, select: { deadline: true } });
  if (settings?.deadline && new Date() > new Date(settings.deadline)) {
    return NextResponse.json({ error: "De deadline is verstreken" }, { status: 403 });
  }

  const prediction = await prisma.teamPrediction.create({
    data: {
      teamEntryId,
      topScorerId: topScorerId || null,
      assistKoningId: assistKoningId || null,
      totalYellowCards: totalYellowCards != null ? Number(totalYellowCards) : null,
      totalGoals: totalGoals != null ? Number(totalGoals) : null,
    },
    include: {
      topScorer: { select: { id: true, name: true } },
      assistKoning: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ prediction });
}
