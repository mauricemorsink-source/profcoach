import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ momentId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { momentId } = await params;
  const moment = await prisma.publishMoment.findUnique({ where: { id: momentId } });
  if (!moment) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  if (moment.publishedAt) {
    return NextResponse.json({ error: "Gepubliceerde momenten kunnen niet worden verwijderd" }, { status: 400 });
  }

  // Unassign all matches first
  await prisma.match.updateMany({
    where: { publishMomentId: momentId },
    data: { publishMomentId: null },
  });

  await prisma.publishMoment.delete({ where: { id: momentId } });
  return NextResponse.json({ ok: true });
}
