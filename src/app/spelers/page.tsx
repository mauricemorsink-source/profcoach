import { prisma } from "@/lib/prisma";
import SpelerslijstClient from "@/components/SpelerslijstClient";

export default async function SpelersPage() {
  const players = await prisma.player.findMany({
    where: { active: true },
    select: { id: true, name: true, position: true, clubTeam: true, value: true },
    orderBy: [{ clubTeam: "asc" }, { position: "asc" }, { name: "asc" }],
  });

  return <SpelerslijstClient players={players} />;
}
