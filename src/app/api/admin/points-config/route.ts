import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const configs = await prisma.pointsConfig.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(configs);
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  for (const row of body) {
    await prisma.pointsConfig.update({
      where: { id: row.id },
      data: {
        gkPoints: row.gkPoints ?? null,
        defPoints: row.defPoints ?? null,
        midPoints: row.midPoints ?? null,
        attPoints: row.attPoints ?? null,
      },
    });
  }

  const configs = await prisma.pointsConfig.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(configs);
}
