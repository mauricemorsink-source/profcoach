import * as dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import { neon } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const statsCount = await prisma.playerSeasonStats.count();
  console.log("PlayerSeasonStats rows:", statsCount);

  if (statsCount > 0) {
    const stats = await prisma.playerSeasonStats.findMany({
      where: { totalPoints: { not: 0 } },
      include: { player: { select: { name: true } } },
      take: 10,
    });
    console.log("Stats with non-zero points:");
    for (const s of stats) {
      console.log(`  ${s.player.name}: totalPoints=${s.totalPoints}, prevPoints=${s.prevPoints}`);
    }
  }

  const byStatus = await prisma.match.groupBy({ by: ["status"], _count: true });
  console.log("\nMatches by status:", byStatus.map(s => `${s.status}:${s._count}`).join(", "));
}

main().catch(console.error).finally(() => prisma.$disconnect());
