import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    return NextResponse.json({ error: "Instellingen niet gevonden" }, { status: 404 });
  }
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  const { budget, deadline, registrationOpen, captainEnabled, captainBonusPerWin, rulesText, termsText, privacyText } = body;

  if (budget !== undefined && (isNaN(Number(budget)) || Number(budget) <= 0)) {
    return NextResponse.json({ error: "Ongeldig budget" }, { status: 400 });
  }

  const settings = await prisma.gameSettings.update({
    where: { id: "singleton" },
    data: {
      ...(budget !== undefined && { budget: Number(budget) }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(registrationOpen !== undefined && { registrationOpen: Boolean(registrationOpen) }),
      ...(captainEnabled !== undefined && { captainEnabled: Boolean(captainEnabled) }),
      ...(captainBonusPerWin !== undefined && { captainBonusPerWin: Math.max(0, Number(captainBonusPerWin) || 0) }),
      ...(rulesText !== undefined && { rulesText: String(rulesText) }),
      ...(termsText !== undefined && { termsText: String(termsText) }),
      ...(privacyText !== undefined && { privacyText: String(privacyText) }),
    },
  });

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }
  const body = await req.json();
  if (body?.resetProcessing === true) {
    const settings = await prisma.gameSettings.update({
      where: { id: "singleton" },
      data: { isProcessing: false },
    });
    return NextResponse.json(settings);
  }
  return NextResponse.json({ error: "Onbekende actie" }, { status: 400 });
}
