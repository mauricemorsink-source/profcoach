import { prisma } from "@/lib/prisma";
import { computeDeelnemersStandings, computeTopStats, getVisibleStandingsPublication, type PublishedStandingsData } from "@/lib/standings";
import TussenstandBeheerClient from "@/components/admin/TussenstandBeheerClient";

export default async function AdminTussenstandPage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } });

  let liveStandings: Awaited<ReturnType<typeof computeDeelnemersStandings>> = [];
  let liveStats: Awaited<ReturnType<typeof computeTopStats>> = { topScorers: [], topAssists: [], topCleanSheets: [] };
  if (season) {
    // Zelfde als bij publiceren: de +/- hier laat zien wat er zou veranderen t.o.v. de vorige
    // publicatie (niet t.o.v. de laatste verwerkronde) — dus exact wat je zou publiceren.
    const previous = await getVisibleStandingsPublication(season.id);
    const prevData = previous?.data as PublishedStandingsData | undefined;
    [liveStandings, liveStats] = await Promise.all([
      computeDeelnemersStandings(season.id, prevData?.deelnemers),
      computeTopStats(season.id, prevData?.stats),
    ]);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-bold text-white">Tussenstand</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Bepaal of deelnemers de tussenstand en statistieken kunnen zien, en welke stand ze precies te zien krijgen.
        </p>
      </div>
      <TussenstandBeheerClient liveStandings={liveStandings} liveStats={liveStats} hasSeason={!!season} />
    </div>
  );
}
