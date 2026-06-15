import { prisma } from "@/lib/prisma";
import TotWClient from "@/components/admin/TotWClient";

export default async function TotWPage() {
  const [matches, formations] = await Promise.all([
    prisma.match.findMany({
      where: { status: "PROCESSED" },
      orderBy: { matchDate: "desc" },
      select: {
        id: true,
        name: true,
        matchDate: true,
        clubTeam: true,
        publishMoment: { select: { label: true } },
      },
    }),
    prisma.formation.findMany({ orderBy: { code: "asc" } }),
  ]);

  return <TotWClient matches={matches} formations={formations} />;
}
