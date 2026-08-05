import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const matches = await prisma.match.findMany({
    orderBy: { matchDate: "desc" },
    include: {
      createdBy: { select: { name: true, email: true } },
      publishMoment: { select: { id: true, label: true, scheduledAt: true, publishedAt: true } },
      performances: {
        include: { player: { select: { name: true, position: true, clubTeam: true } } },
        orderBy: { player: { name: "asc" } },
      },
    },
  });

  return NextResponse.json(matches);
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  const { ids } = body as { ids: string[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Geen wedstrijden opgegeven" }, { status: 400 });
  }

  const targets = await prisma.match.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true },
  });

  // PROCESSED wedstrijden: soft-delete → CORRECTION (punten moeten teruggedraaid worden)
  const processedIds = targets.filter((m) => m.status === "PROCESSED").map((m) => m.id);
  if (processedIds.length > 0) {
    await prisma.match.updateMany({ where: { id: { in: processedIds } }, data: { status: "CORRECTION" } });
  }

  // Overige statussen: hard delete
  const deletableIds = targets.filter((m) => m.status !== "PROCESSED").map((m) => m.id);
  if (deletableIds.length > 0) {
    await prisma.matchPerformance.deleteMany({ where: { matchId: { in: deletableIds } } });
    await prisma.match.deleteMany({ where: { id: { in: deletableIds } } });
  }

  return NextResponse.json({ deleted: deletableIds.length, corrected: processedIds.length });
}
