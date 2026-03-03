import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function getEffectiveTeam(session: { role: string; managedTeam?: string | null }, req: NextRequest): string | null {
  if (session.managedTeam) return session.managedTeam;
  if (session.role === "ADMIN") return req.nextUrl.searchParams.get("adminTeam");
  return null;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "MANAGER" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const team = getEffectiveTeam(session, req);
  if (!team) return NextResponse.json({ error: "Geen elftal toegewezen" }, { status: 403 });

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json([]);

  const matches = await prisma.match.findMany({
    where: { clubTeam: team as any, seasonId: season.id },
    orderBy: { matchDate: "desc" },
    include: { _count: { select: { performances: true } } },
  });

  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "MANAGER" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const team = getEffectiveTeam(session, req);
  if (!team) return NextResponse.json({ error: "Geen elftal toegewezen" }, { status: 403 });

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });

  const body = await req.json();
  const { name, homeAway, matchDate, goalsScored, goalsConceded } = body;

  if (!name?.trim() || !matchDate) {
    return NextResponse.json({ error: "Naam en datum zijn verplicht" }, { status: 400 });
  }

  const match = await prisma.match.create({
    data: {
      seasonId: season.id,
      clubTeam: team as any,
      name: name.trim(),
      homeAway: homeAway ?? "HOME",
      matchDate: new Date(matchDate),
      goalsScored: Number(goalsScored) || 0,
      goalsConceded: Number(goalsConceded) || 0,
      status: "PENDING",
      createdById: session.userId,
    },
  });

  return NextResponse.json(match, { status: 201 });
}
