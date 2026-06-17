import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [season, formations, settings] = await Promise.all([
    prisma.season.findFirst({ where: { isActive: true } }),
    prisma.formation.findMany({ orderBy: { code: "asc" } }),
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
  ]);
  return NextResponse.json({ season, formations, budget: settings?.budget ?? 1750 });
}