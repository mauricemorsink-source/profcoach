import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { neon } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hashSync } from "bcryptjs";

const neonClient = neon(process.env.DATABASE_URL!);
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Seizoen aanmaken
  await prisma.season.upsert({
    where: { id: "season-2526" },
    update: {},
    create: { id: "season-2526", name: "2025/26", isActive: true },
  });

  // Formaties aanmaken
  const formations = [
    { code: "1-4-3-3", defenders: 4, midfielders: 3, attackers: 3 },
    { code: "1-4-4-2", defenders: 4, midfielders: 4, attackers: 2 },
    { code: "1-5-3-2", defenders: 5, midfielders: 3, attackers: 2 },
    { code: "1-3-5-2", defenders: 3, midfielders: 5, attackers: 2 },
    { code: "1-3-4-3", defenders: 3, midfielders: 4, attackers: 3 },
  ];

  for (const f of formations) {
    await prisma.formation.upsert({
      where: { code: f.code },
      update: {},
      create: f,
    });
  }

  // Voorbeeldspelers aanmaken
  const players = [
    { name: "Jan de Keeper", position: "GK", clubTeam: "ONE", value: 150 },
    { name: "Piet de Keeper", position: "GK", clubTeam: "TWO", value: 130 },
    { name: "Tom Verdediger", position: "DEF", clubTeam: "ONE", value: 120 },
    { name: "Kees Verdediger", position: "DEF", clubTeam: "TWO", value: 110 },
    { name: "Lars Verdediger", position: "DEF", clubTeam: "THREE", value: 115 },
    { name: "Erik Verdediger", position: "DEF", clubTeam: "FOUR", value: 105 },
    { name: "Bas Verdediger", position: "DEF", clubTeam: "FIVE", value: 100 },
    { name: "Inge Verdediger", position: "DEF", clubTeam: "DAMES", value: 95 },
    { name: "Marc Middenvelder", position: "MID", clubTeam: "ONE", value: 140 },
    { name: "Sven Middenvelder", position: "MID", clubTeam: "TWO", value: 135 },
    { name: "Daan Middenvelder", position: "MID", clubTeam: "THREE", value: 125 },
    { name: "Niels Middenvelder", position: "MID", clubTeam: "FOUR", value: 120 },
    { name: "Tim Middenvelder", position: "MID", clubTeam: "FIVE", value: 115 },
    { name: "Sara Middenvelder", position: "MID", clubTeam: "DAMES", value: 110 },
    { name: "Rick Aanvaller", position: "ATT", clubTeam: "ONE", value: 160 },
    { name: "Joey Aanvaller", position: "ATT", clubTeam: "TWO", value: 155 },
    { name: "Kevin Aanvaller", position: "ATT", clubTeam: "THREE", value: 145 },
    { name: "Bram Aanvaller", position: "ATT", clubTeam: "FOUR", value: 140 },
    { name: "Lotte Aanvaller", position: "ATT", clubTeam: "DAMES", value: 135 },
    { name: "Finn Aanvaller", position: "ATT", clubTeam: "FIVE", value: 130 },
  ] as const;

  for (const p of players) {
    await prisma.player.create({ data: { ...p, active: true } }).catch(() => {});
  }

  // Admin gebruiker aanmaken (wachtwoord altijd bijwerken zodat seed altijd klopt)
  const adminHash = hashSync("changeme123", 10);
  await prisma.user.upsert({
    where: { email: "admin@profcoach.nl" },
    update: { password: adminHash },
    create: {
      email: "admin@profcoach.nl",
      password: adminHash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  // Spelinstellingen aanmaken (singleton)
  await prisma.gameSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  // Puntenconfiguratie aanmaken (update: {} zodat admin-aanpassingen bewaard blijven)
  const pointsConfigs = [
    { id: "goal",          label: "Doelpunt (incl. vrije trap)", gkPoints: 6,  defPoints: 5,  midPoints: 4,    attPoints: 2    },
    { id: "penaltyGoal",   label: "Strafschop",                  gkPoints: 1,  defPoints: 1,  midPoints: 1,    attPoints: 1    },
    { id: "assist",        label: "Assist",                      gkPoints: 4,  defPoints: 3,  midPoints: 2,    attPoints: 1    },
    { id: "ownGoal",       label: "Eigen doelpunt",              gkPoints: -2, defPoints: -2, midPoints: -2,   attPoints: -2   },
    { id: "win",           label: "Gewonnen wedstrijd",          gkPoints: 3,  defPoints: 3,  midPoints: 3,    attPoints: 3    },
    { id: "draw",          label: "Gelijkspel",                  gkPoints: 1,  defPoints: 1,  midPoints: 1,    attPoints: 1    },
    { id: "yellowCard",    label: "Gele kaart",                  gkPoints: -2, defPoints: -2, midPoints: -2,   attPoints: -3   },
    { id: "redCard",       label: "Directe rode kaart",          gkPoints: -5, defPoints: -5, midPoints: -5,   attPoints: -5   },
    { id: "goalsConceded", label: "Tegendoelpunt",               gkPoints: -1, defPoints: -1, midPoints: null, attPoints: null },
    { id: "cleanSheet",    label: "Nul houden",                  gkPoints: 5,  defPoints: 4,  midPoints: null, attPoints: null },
  ];

  for (const config of pointsConfigs) {
    await prisma.pointsConfig.upsert({
      where: { id: config.id },
      update: {},
      create: config,
    });
  }

  console.log("✅ Seed klaar!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());