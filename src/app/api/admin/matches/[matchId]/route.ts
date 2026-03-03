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
  const { status } = await req.json();

  if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Wedstrijd niet gevonden" }, { status: 404 });
  }
  if (match.status === "PROCESSED") {
    return NextResponse.json({ error: "Verwerkte wedstrijden kunnen niet meer worden gewijzigd" }, { status: 400 });
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { status },
  });

  return NextResponse.json(updated);
}
