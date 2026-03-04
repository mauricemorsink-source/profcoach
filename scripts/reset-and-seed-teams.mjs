import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { neon } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hashSync } from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DUMMY_NAMES = [
  "Maarten Bakker", "Joost van Dijk", "Tim Hendriks", "Sander de Vries",
  "Robin Smit", "Lars Janssen", "Kevin Meijer", "Daan Peters",
  "Rick Willems", "Bas Kuijpers",
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickTeam(allPlayers, formation, budget) {
  const needed = { GK: 1, DEF: formation.defenders, MID: formation.midfielders, ATT: formation.attackers };
  const clubCount = {};
  const selected = [];
  let spent = 0;

  for (const [pos, count] of Object.entries(needed)) {
    const pool = shuffle(allPlayers.filter(p => p.position === pos));
    let picked = 0;
    for (const p of pool) {
      if (picked >= count) break;
      const club = p.clubTeam;
      if ((clubCount[club] ?? 0) >= 2) continue;
      if (spent + p.value > budget) continue;
      selected.push(p);
      clubCount[club] = (clubCount[club] ?? 0) + 1;
      spent += p.value;
      picked++;
    }
    if (picked < count) return null; // can't fill position
  }
  return selected;
}

async function main() {
  // 1. Leegmaken van alle team-data
  console.log("🗑️  Leegmaken TeamEntryPlayer...");
  await prisma.teamEntryPlayer.deleteMany();
  console.log("🗑️  Leegmaken TeamEntry...");
  await prisma.teamEntry.deleteMany();
  console.log("🗑️  Leegmaken dummy users (email eindigt op @dummy.profcoach)...");
  await prisma.user.deleteMany({ where: { email: { endsWith: "@dummy.profcoach" } } });
  console.log("✅ Leeggemaakt\n");

  // 2. Benodigde data ophalen
  const players = await prisma.player.findMany({ where: { active: true } });
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  const formations = await prisma.formation.findMany();
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });

  if (!season) throw new Error("Geen actief seizoen gevonden!");
  const budget = settings?.budget ?? 1750;

  console.log(`📋 ${players.length} spelers | Budget: €${budget} | Seizoen: ${season.name}\n`);

  // 3. 10 dummy teams aanmaken
  const formationPool = [...formations, ...formations]; // herhaal zodat we genoeg hebben
  let created = 0;

  for (let i = 0; i < DUMMY_NAMES.length; i++) {
    const name = DUMMY_NAMES[i];
    const email = `dummy${i + 1}@dummy.profcoach`;
    const formation = formationPool[i % formations.length];

    // Probeer een geldig team samen te stellen (max 10 pogingen)
    let teamPlayers = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      teamPlayers = pickTeam(players, formation, budget);
      if (teamPlayers) break;
    }

    if (!teamPlayers) {
      console.warn(`⚠️  Kon geen geldig team samenstellen voor ${name}, overgeslagen.`);
      continue;
    }

    // Dummy user aanmaken
    const user = await prisma.user.create({
      data: {
        email,
        password: hashSync("dummy123", 10),
        name,
        role: "USER",
        isParticipant: true,
      },
    });

    // TeamEntry aanmaken
    const teamEntry = await prisma.teamEntry.create({
      data: {
        seasonId: season.id,
        formationId: formation.id,
        userId: user.id,
        locked: true,
      },
    });

    // Spelers koppelen
    const positions = ["GK", ...Array(formation.defenders).fill("DEF"), ...Array(formation.midfielders).fill("MID"), ...Array(formation.attackers).fill("ATT")];
    const sorted = [];
    for (const pos of ["GK", "DEF", "MID", "ATT"]) {
      sorted.push(...teamPlayers.filter(p => p.position === pos));
    }

    for (let slot = 0; slot < sorted.length; slot++) {
      await prisma.teamEntryPlayer.create({
        data: { teamEntryId: teamEntry.id, playerId: sorted[slot].id, slotIndex: slot },
      });
    }

    const totalValue = sorted.reduce((s, p) => s + p.value, 0);
    const clubCounts = {};
    sorted.forEach(p => clubCounts[p.clubTeam] = (clubCounts[p.clubTeam] ?? 0) + 1);

    console.log(`✅ ${name} | ${formation.code} | €${totalValue}/${budget} | Clubs: ${Object.entries(clubCounts).map(([k,v]) => `${k}:${v}`).join(", ")}`);
    created++;
  }

  console.log(`\n🎉 ${created} dummy teams aangemaakt!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
