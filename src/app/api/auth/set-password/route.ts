import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const { password } = await req.json();
  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Wachtwoord moet minimaal 6 tekens zijn" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      password: hashPassword(password),
      mustChangePassword: false,
    },
  });

  // Sessie vernieuwen (zelfde payload, flag is nu weg)
  await setSessionCookie({ ...session });

  return NextResponse.json({ ok: true });
}
