import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { matchId } = await params;
  const body = await req.json();
  const { status, name, matchDate, goalsScored, goalsConceded, homeAway } = body;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Wedstrijd niet gevonden" }, { status: 404 });
  }

  // CORRECTION: only allow cancelling (reverting to PROCESSED)
  if (match.status === "CORRECTION") {
    if (status !== "PROCESSED") {
      return NextResponse.json({ error: "Correctie-wedstrijden kunnen alleen worden geannuleerd" }, { status: 400 });
    }
    const updated = await prisma.match.update({ where: { id: matchId }, data: { status: "PROCESSED" } });
    return NextResponse.json(updated);
  }

  if (match.status === "PROCESSED") {
    return NextResponse.json({ error: "Verwerkte wedstrijden kunnen niet meer worden gewijzigd" }, { status: 400 });
  }

  if (status && !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      ...(status && { status }),
      ...(name !== undefined && { name: String(name) }),
      ...(matchDate !== undefined && { matchDate: new Date(matchDate) }),
      ...(goalsScored !== undefined && { goalsScored: Number(goalsScored) }),
      ...(goalsConceded !== undefined && { goalsConceded: Number(goalsConceded) }),
      ...(homeAway !== undefined && { homeAway }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { matchId } = await params;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  // PROCESSED match: soft-delete → CORRECTION (punten moeten teruggedraaid worden)
  if (match.status === "PROCESSED") {
    await prisma.match.update({ where: { id: matchId }, data: { status: "CORRECTION" } });
    return NextResponse.json({ ok: true, correction: true });
  }

  // Overige statussen: hard delete
  await prisma.matchPerformance.deleteMany({ where: { matchId } });
  await prisma.match.delete({ where: { id: matchId } });

  return NextResponse.json({ ok: true, correction: false });
}
