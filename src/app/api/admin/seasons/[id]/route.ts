import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  if (body?.activate !== true) {
    return NextResponse.json({ error: "Onbekende actie" }, { status: 400 });
  }

  const target = await prisma.season.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Seizoen niet gevonden" }, { status: 404 });
  }
  if (target.isActive) {
    return NextResponse.json(target);
  }

  const season = await prisma.$transaction(async (tx) => {
    await tx.season.updateMany({ where: { isActive: true }, data: { isActive: false } });
    return tx.season.update({ where: { id }, data: { isActive: true } });
  });

  return NextResponse.json(season);
}
