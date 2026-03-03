import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const players = await prisma.player.findMany({
    where: { active: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(players);
}