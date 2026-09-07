import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getManagerAuthContext } from "@/lib/managerAuth";

export async function GET(req: NextRequest) {
  const auth = await getManagerAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  const { team } = auth;

  // ?all=true → alle spelers van alle elftallen (voor gastspelers)
  const all = req.nextUrl.searchParams.get("all") === "true";

  const players = await prisma.player.findMany({
    where: all
      ? { active: true }
      : { active: true, OR: [{ clubTeam: team as any, altTeam: null }, { altTeam: team as any }] },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, name: true, position: true, clubTeam: true, altTeam: true },
  });

  return NextResponse.json(players);
}
