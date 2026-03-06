import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  try {
    const moments = await prisma.publishMoment.findMany({ orderBy: { scheduledAt: "asc" } });
    return NextResponse.json(moments.map((m) => ({ ...m, matches: [] })));
  } catch (e: unknown) {
    console.error("publish-moments GET error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { label, scheduledAt } = await req.json();
  if (!label || !scheduledAt) {
    return NextResponse.json({ error: "Label en datum zijn verplicht" }, { status: 400 });
  }

  const moment = await prisma.publishMoment.create({
    data: { label, scheduledAt: new Date(scheduledAt) },
  });

  return NextResponse.json(moment);
}
