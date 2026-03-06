import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "Geen bestand gevonden" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet) as {
    Naam: string;
    Positie: string;
    Team: string;
    Waarde: number;
  }[];

  const validPositions = ["GK", "DEF", "MID", "ATT"];
  const validTeams = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];

  let imported = 0;
  let alreadyPresent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const naam = row.Naam?.toString().trim();
    const positie = row.Positie?.toString().trim().toUpperCase();
    const team = row.Team?.toString().trim().toUpperCase();
    const waarde = Number(row.Waarde);

    if (!naam || !positie || !team) {
      skipped++;
      continue;
    }

    if (!validPositions.includes(positie)) {
      errors.push(`${naam}: ongeldige positie "${positie}"`);
      skipped++;
      continue;
    }

    if (!validTeams.includes(team)) {
      errors.push(`${naam}: ongeldig team "${team}"`);
      skipped++;
      continue;
    }

    if (isNaN(waarde) || waarde <= 0) {
      errors.push(`${naam}: ongeldige waarde "${row.Waarde}"`);
      skipped++;
      continue;
    }

    // Controleer op exacte duplicate (naam + elftal + positie + waarde)
    const duplicate = await prisma.player.findFirst({
      where: {
        name: naam,
        clubTeam: team as any,
        position: positie as any,
        value: waarde,
        active: true,
      },
    });

    if (duplicate) {
      alreadyPresent++;
      continue;
    }

    await prisma.player.create({
      data: {
        name: naam,
        position: positie as any,
        clubTeam: team as any,
        value: waarde,
        active: true,
      },
    });

    imported++;
  }

  return NextResponse.json({ imported, alreadyPresent, skipped, errors });
}
