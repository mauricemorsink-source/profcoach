import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managedTeam: true,
      isParticipant: true,
      createdAt: true,
      teamEntries: {
        where: season ? { seasonId: season.id } : { id: "none" },
        include: {
          formation: true,
          players: {
            include: { player: true },
            orderBy: { slotIndex: "asc" },
          },
        },
        take: 1,
      },
    },
  });

  return NextResponse.json(users);
}
