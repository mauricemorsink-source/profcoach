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
      performances: {
        include: { player: { select: { name: true, position: true, clubTeam: true } } },
        orderBy: { player: { name: "asc" } },
      },
    },
  });

  return NextResponse.json(matches);
}
