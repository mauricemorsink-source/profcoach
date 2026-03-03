import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [season, formations] = await Promise.all([
    prisma.season.findFirst({ where: { isActive: true } }),
    prisma.formation.findMany({ orderBy: { code: "asc" } }),
  ]);
  return NextResponse.json({ season, formations });
}