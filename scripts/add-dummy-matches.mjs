import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { neon } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const OPPONENTS = ["Neede", "Hoeve", "Eibergen", "Lochuizen", "Haar.lo", "Noordijk"];

const MATCHES_PLAN = [
  // [clubTeam, opponent, homeAway, goalsScored, goalsConceded, status]
  ["ONE",   "Neede 1",      "HOME", 2, 1, "APPROVED"],
  ["ONE",   "Eibergen 2",   "AWAY", 1, 3, "APPROVED"],
  ["TWO",   "Hoeve 2",      "HOME", 3, 0, "APPROVED"],
  ["TWO",   "Noordijk 2",   "AWAY", 2, 2, "APPROVED"],
  ["THREE", "Lochuizen 3",  "HOME", 1, 1, "APPROVED"],
  ["THREE", "Haar.lo 3",    "HOME", 4, 1, "APPROVED"],
  ["FOUR",  "Neede 4",      "HOME", 0, 1, "APPROVED"],
  ["FOUR",  "Eibergen 4",   "AWAY", 2, 0, "APPROVED"],
  ["FIVE",  "Hoeve 5",      "HOME", 1, 0, "APPROVED"],
  ["DAMES", "Haar.lo VR1",  "HOME", 3, 1, "APPROVED"],
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Distribute goals and assists randomly among ATT/MID players
function buildPerformances(players, goalsScored) {
  const perfs = {};
  for (const p of players) {
    perfs[p.id] = { playerId: p.id, played: true, goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false };
  }

  // Randomly bench 1-2 players
  const benched = shuffle(players).slice(0, randomInt(1, 2));
  for (const b of benched) perfs[b.id].played = false;

  const active = players.filter(p => perfs[p.id].played);

  // Distribute goals (prefer ATT > MID > DEF > GK)
  const scorerPool = [
    ...active.filter(p => p.position === "ATT"),
    ...active.filter(p => p.position === "ATT"),
    ...active.filter(p => p.position === "MID"),
    ...active.filter(p => p.position === "DEF"),
  ];
  let remaining = goalsScored;
  if (scorerPool.length > 0 && remaining > 0) {
    // Pen goal for 1 goal max
    if (remaining > 0 && Math.random() < 0.3) {
      const scorer = scorerPool[randomInt(0, scorerPool.length - 1)];
      perfs[scorer.id].penaltyGoals += 1;
      remaining--;
    }
    for (let g = 0; g < remaining; g++) {
      const scorer = scorerPool[randomInt(0, scorerPool.length - 1)];
      perfs[scorer.id].goals += 1;
    }
    // Assists (about 60% of goals get an assist)
    const assistPool = active.filter(p => p.position !== "GK");
    const assistCount = Math.ceil(goalsScored * 0.6);
    for (let a = 0; a < assistCount && assistPool.length > 0; a++) {
      const p = assistPool[randomInt(0, assistPool.length - 1)];
      perfs[p.id].assists += 1;
    }
  }

  // Cards (rare)
  for (const p of active) {
    if (Math.random() < 0.1) perfs[p.id].yellowCards = 1;
    if (Math.random() < 0.02) perfs[p.id].redCard = true;
  }

  return Object.values(perfs);
}

async function main() {
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) throw new Error("Geen actief seizoen gevonden!");

  // Clean up existing dummy matches
  console.log("🗑️  Verwijder bestaande dummy wedstrijden...");
  const existing = await prisma.match.findMany({
    where: {
      seasonId: season.id,
      name: { in: MATCHES_PLAN.map(m => m[1]) },
    },
  });
  for (const m of existing) {
    await prisma.matchPerformance.deleteMany({ where: { matchId: m.id } });
    await prisma.match.delete({ where: { id: m.id } });
  }

  const allPlayers = await prisma.player.findMany({ where: { active: true } });
  const byTeam = {};
  for (const p of allPlayers) {
    if (!byTeam[p.clubTeam]) byTeam[p.clubTeam] = [];
    byTeam[p.clubTeam].push(p);
  }

  let created = 0;
  // Base date: start 8 weeks ago, one match per week
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 8 * 7);

  for (let i = 0; i < MATCHES_PLAN.length; i++) {
    const [clubTeam, opponent, homeAway, goalsScored, goalsConceded, status] = MATCHES_PLAN[i];
    const players = byTeam[clubTeam] ?? [];

    const matchDate = new Date(baseDate);
    matchDate.setDate(matchDate.getDate() + i * 5); // spread ~5 days apart

    const match = await prisma.match.create({
      data: {
        seasonId: season.id,
        clubTeam,
        name: opponent,
        homeAway,
        matchDate,
        goalsScored,
        goalsConceded,
        status,
      },
    });

    if (players.length > 0) {
      const perfs = buildPerformances(players, goalsScored);
      for (const perf of perfs) {
        await prisma.matchPerformance.create({
          data: {
            matchId: match.id,
            playerId: perf.playerId,
            played: perf.played,
            goals: perf.goals,
            penaltyGoals: perf.penaltyGoals,
            assists: perf.assists,
            ownGoals: perf.ownGoals,
            yellowCards: perf.yellowCards,
            redCard: perf.redCard,
          },
        });
      }
    }

    const score = homeAway === "AWAY" ? `${goalsConceded}–${goalsScored}` : `${goalsScored}–${goalsConceded}`;
    console.log(`✅ ${clubTeam.padEnd(5)} vs ${opponent.padEnd(14)} ${homeAway.padEnd(7)} ${score}  [${status}]  (${players.length} spelers)`);
    created++;
  }

  console.log(`\n🎉 ${created} dummy wedstrijden aangemaakt (status: APPROVED — klik "Verwerk" om de tussenstand bij te werken)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
