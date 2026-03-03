import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "MANAGER" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const team = session.managedTeam || (session.role === "ADMIN" ? req.nextUrl.searchParams.get("adminTeam") : null);
  if (!team) return NextResponse.json({ error: "Geen elftal toegewezen" }, { status: 403 });

  // ?all=true → alle spelers van alle elftallen (voor gastspelers)
  const all = req.nextUrl.searchParams.get("all") === "true";

  const players = await prisma.player.findMany({
    where: all ? { active: true } : { clubTeam: team as any, active: true },
    orderBy: [{ clubTeam: "asc" }, { position: "asc" }, { name: "asc" }],
    select: { id: true, name: true, position: true, clubTeam: true },
  });

  return NextResponse.json(players);
}
