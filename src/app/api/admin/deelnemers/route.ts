import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json([]);

  const entries = await prisma.teamEntry.findMany({
    where: { seasonId: season.id },
    orderBy: { createdAt: "asc" },
    include: {
      formation: true,
      players: {
        include: { player: true },
        orderBy: { slotIndex: "asc" },
      },
      prediction: {
        include: {
          topScorer: { select: { id: true, name: true } },
          assistKoning: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(entries);
}
