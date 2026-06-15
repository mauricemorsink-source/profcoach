import { prisma } from "@/lib/prisma";

const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

function Delta({ value }: { value: number }) {
  if (!value || !isFinite(value)) return null;
  return (
    <span className={`text-xs font-semibold ${value > 0 ? "text-emerald-400" : "text-red-400"}`}>
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

export default async function StatistiekenPage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } });

  let topScorers: { playerId: string; playerName: string; clubTeam: string; goals: number; delta: number }[] = [];
  let topAssists: { playerId: string; playerName: string; clubTeam: string; assists: number; delta: number }[] = [];
  let topPoints: { playerId: string; playerName: string; clubTeam: string; totalPoints: number; delta: number }[] = [];
  let topCleanSheets: { playerId: string; playerName: string; cleanSheets: number; delta: number }[] = [];

  if (season) {
    const allStats = await prisma.playerSeasonStats.findMany({
      where: { seasonId: season.id },
      include: { player: { select: { name: true, position: true, clubTeam: true } } },
    });

    topScorers = allStats
      .filter((s) => s.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10)
      .map((s) => ({ playerId: s.playerId, playerName: s.player.name, clubTeam: s.player.clubTeam, goals: s.goals, delta: s.goals - (s.prevGoals ?? 0) }));

    topAssists = allStats
      .filter((s) => s.assists > 0)
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 10)
      .map((s) => ({ playerId: s.playerId, playerName: s.player.name, clubTeam: s.player.clubTeam, assists: s.assists, delta: s.assists - (s.prevAssists ?? 0) }));

    topPoints = allStats
      .filter((s) => s.totalPoints > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10)
      .map((s) => ({ playerId: s.playerId, playerName: s.player.name, clubTeam: s.player.clubTeam, totalPoints: s.totalPoints, delta: s.totalPoints - (s.prevPoints ?? 0) }));

    topCleanSheets = allStats
      .filter((s) => s.player.position === "GK" && s.cleanSheets > 0)
      .sort((a, b) => b.cleanSheets - a.cleanSheets)
      .slice(0, 10)
      .map((s) => ({ playerId: s.playerId, playerName: s.player.name, cleanSheets: s.cleanSheets, delta: s.cleanSheets - (s.prevCleanSheets ?? 0) }));
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 neon-border rounded-2xl p-5">
        <h2 className="font-bold text-white mb-3 text-sm uppercase tracking-wide text-slate-400">Topscorers</h2>
        {topScorers.length === 0 ? (
          <p className="text-slate-500 text-sm">Nog geen doelpunten.</p>
        ) : (
          <ol className="space-y-2">
            {topScorers.map((p, i) => (
              <li key={p.playerId} className="flex items-center gap-2">
                <span className="text-slate-600 w-5 text-right text-sm shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{p.playerName}</div>
                  <div className="text-slate-500 text-xs">{TEAM_LABEL[p.clubTeam] ?? p.clubTeam}</div>
                </div>
                <span className="font-bold text-cyan-400 w-7 text-right shrink-0">{p.goals}</span>
                <span className="w-10 text-right shrink-0"><Delta value={p.delta} /></span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="bg-slate-900 neon-border rounded-2xl p-5">
        <h2 className="font-bold text-sm uppercase tracking-wide text-slate-400 mb-3">Meeste assists</h2>
        {topAssists.length === 0 ? (
          <p className="text-slate-500 text-sm">Nog geen assists.</p>
        ) : (
          <ol className="space-y-2">
            {topAssists.map((p, i) => (
              <li key={p.playerId} className="flex items-center gap-2">
                <span className="text-slate-600 w-5 text-right text-sm shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{p.playerName}</div>
                  <div className="text-slate-500 text-xs">{TEAM_LABEL[p.clubTeam] ?? p.clubTeam}</div>
                </div>
                <span className="font-bold text-cyan-400 w-7 text-right shrink-0">{p.assists}</span>
                <span className="w-10 text-right shrink-0"><Delta value={p.delta} /></span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="bg-slate-900 neon-border rounded-2xl p-5">
        <h2 className="font-bold text-sm uppercase tracking-wide text-slate-400 mb-3">Meeste punten (spelers)</h2>
        {topPoints.length === 0 ? (
          <p className="text-slate-500 text-sm">Nog geen punten verwerkt.</p>
        ) : (
          <ol className="space-y-2">
            {topPoints.map((p, i) => (
              <li key={p.playerId} className="flex items-center gap-2">
                <span className="text-slate-600 w-5 text-right text-sm shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{p.playerName}</div>
                  <div className="text-slate-500 text-xs">{TEAM_LABEL[p.clubTeam] ?? p.clubTeam}</div>
                </div>
                <span className="font-bold text-cyan-400 w-7 text-right shrink-0">{p.totalPoints}</span>
                <span className="w-10 text-right shrink-0"><Delta value={p.delta} /></span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="bg-slate-900 neon-border rounded-2xl p-5">
        <h2 className="font-bold text-sm uppercase tracking-wide text-slate-400 mb-3">Meeste clean sheets (keepers)</h2>
        {topCleanSheets.length === 0 ? (
          <p className="text-slate-500 text-sm">Nog geen clean sheets.</p>
        ) : (
          <ol className="space-y-2">
            {topCleanSheets.map((p, i) => (
              <li key={p.playerId} className="flex items-center gap-2">
                <span className="text-slate-600 w-5 text-right text-sm shrink-0">{i + 1}</span>
                <span className="flex-1 min-w-0 font-medium text-white truncate">{p.playerName}</span>
                <span className="font-bold text-cyan-400 w-7 text-right shrink-0">{p.cleanSheets}</span>
                <span className="w-10 text-right shrink-0"><Delta value={p.delta} /></span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
