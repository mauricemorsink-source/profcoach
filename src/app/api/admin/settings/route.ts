import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

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
  const { budget, deadline, registrationOpen, requireLogin, inschrijfgeld, captainEnabled, captainBonusPerWin, rulesText, termsText, privacyText, showTussenstand, showStatistieken, wijzigingsvensterOpen } = body;

  if (budget !== undefined && (isNaN(Number(budget)) || Number(budget) <= 0)) {
    return NextResponse.json({ error: "Ongeldig budget" }, { status: 400 });
  }

  const settings = await prisma.gameSettings.update({
    where: { id: "singleton" },
    data: {
      ...(budget !== undefined && { budget: Number(budget) }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(registrationOpen !== undefined && { registrationOpen: Boolean(registrationOpen) }),
      ...(requireLogin !== undefined && { requireLogin: Boolean(requireLogin) }),
      ...(inschrijfgeld !== undefined && { inschrijfgeld: Math.max(0, Math.round(Number(inschrijfgeld) * 100)) }),
      ...(captainEnabled !== undefined && { captainEnabled: Boolean(captainEnabled) }),
      ...(captainBonusPerWin !== undefined && { captainBonusPerWin: Math.max(0, Number(captainBonusPerWin) || 0) }),
      ...(rulesText !== undefined && { rulesText: String(rulesText) }),
      ...(termsText !== undefined && { termsText: String(termsText) }),
      ...(privacyText !== undefined && { privacyText: String(privacyText) }),
      ...(showTussenstand !== undefined && { showTussenstand: Boolean(showTussenstand) }),
      ...(showStatistieken !== undefined && { showStatistieken: Boolean(showStatistieken) }),
      ...(wijzigingsvensterOpen !== undefined && { wijzigingsvensterOpen: Boolean(wijzigingsvensterOpen) }),
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
