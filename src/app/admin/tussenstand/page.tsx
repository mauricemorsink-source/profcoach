import { prisma } from "@/lib/prisma";
import { computeDeelnemersStandings, computeTopStats } from "@/lib/standings";
import TussenstandBeheerClient from "@/components/admin/TussenstandBeheerClient";

export default async function AdminTussenstandPage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  const [liveStandings, liveStats] = season
    ? await Promise.all([computeDeelnemersStandings(season.id), computeTopStats(season.id)])
    : [[], { topScorers: [], topAssists: [], topCleanSheets: [] }];

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
