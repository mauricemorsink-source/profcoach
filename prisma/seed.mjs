import { neon } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const url = "postgresql://neondb_owner:npg_34stCrODlfnG@ep-fragrant-queen-ab5jlp2g.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const adapter = new PrismaNeon({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Start seed...");

  // Seizoen
  await prisma.season.upsert({
    where: { id: "season-2526" },
    update: {},
    create: { id: "season-2526", name: "2025/26", isActive: true },
  });

  // Formaties
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

  // Spelers
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
  ];

  for (const p of players) {
    await prisma.player.create({ data: { ...p, active: true } }).catch(() => {});
  }

  console.log("✅ Seed klaar!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());