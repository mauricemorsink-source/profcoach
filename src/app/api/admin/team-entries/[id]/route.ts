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
  const { bonusPoints } = await req.json();
  const parsed = Number(bonusPoints);

  const entry = await prisma.teamEntry.update({
    where: { id },
    data: { bonusPoints: Number.isFinite(parsed) ? parsed : 0 },
    select: { id: true, bonusPoints: true },
  });

  return NextResponse.json(entry);
}
