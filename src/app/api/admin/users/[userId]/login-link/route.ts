import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { userId } = await params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Gebruiker niet gevonden" }, { status: 404 });
  }

  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 uur geldig

  await prisma.user.update({
    where: { id: userId },
    data: {
      loginToken: token,
      loginTokenExpiry: expiry,
      mustChangePassword: true,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://profcoach.vercel.app";
  const link = `${baseUrl}/auth/magic?token=${token}`;

  return NextResponse.json({ link });
}
