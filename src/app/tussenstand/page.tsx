import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeelnemersTable from "@/components/tussenstand/DeelnemersTable";

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

export default async function TussenstandPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "statistieken" ? "statistieken" : "deelnemers";

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });

  let deelnemers: {
    userId: string; userName: string; totalPoints: number; prevPoints: number; delta: number;
  }[] = [];

  let topScorers: { playerId: string; playerName: string; position: string; clubTeam: string; goals: number; delta: number }[] = [];
  let topAssists: { playerId: string; playerName: string; position: string; clubTeam: string; assists: number; delta: number }[] = [];
  let topPoints: { playerId: string; playerName: string; position: string; clubTeam: string; totalPoints: number; delta: number }[] = [];
  let topCleanSheets: { playerId: string; playerName: string; cleanSheets: number; delta: number }[] = [];

  if (season) {
    const allStats = await prisma.playerSeasonStats.findMany({
      where: { seasonId: season.id },
      include: { player: { select: { name: true, position: true, clubTeam: true } } },
    });

    const teamEntries = await prisma.teamEntry.findMany({
      where: { seasonId: season.id, userId: { not: null }, user: { isParticipant: true } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        players: { select: { playerId: true, slotIndex: true } },
      },
    });

    const statsMap = new Map(allStats.map((s) => [s.playerId, s]));
    const captainActive = settings?.captainEnabled ?? false;

    deelnemers = teamEntries
      .filter((te) => te.user !== null)
      .map((te) => {
        const captainPlayerId = captainActive && te.captainSlot !== null
          ? te.players.find((p) => p.slotIndex === te.captainSlot)?.playerId ?? null
          : null;
        let totalPoints = 0;
        let prevPoints = 0;
        for (const p of te.players) {
          const stat = statsMap.get(p.playerId);
          if (stat) {
            totalPoints += stat.totalPoints;
            prevPoints += stat.prevPoints;
            if (p.playerId === captainPlayerId) {
              // Captain counts double
              totalPoints += stat.totalPoints;
              prevPoints += stat.prevPoints;
            }
          }
        }
        return { userId: te.user!.id, userName: te.user!.name ?? te.user!.email, totalPoints, prevPoints, delta: isFinite(totalPoints - prevPoints) ? totalPoints - prevPoints : 0 };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);

    topScorers = allStats
      .filter((s) => s.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10)
      .map((s) => ({ playerId: s.playerId, playerName: s.player.name, position: s.player.position, clubTeam: s.player.clubTeam, goals: s.goals, delta: s.goals - (s.prevGoals ?? 0) }));

    topAssists = allStats
      .filter((s) => s.assists > 0)
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 10)
      .map((s) => ({ playerId: s.playerId, playerName: s.player.name, position: s.player.position, clubTeam: s.player.clubTeam, assists: s.assists, delta: s.assists - (s.prevAssists ?? 0) }));

    topPoints = allStats
      .filter((s) => s.totalPoints > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10)
      .map((s) => ({ playerId: s.playerId, playerName: s.player.name, position: s.player.position, clubTeam: s.player.clubTeam, totalPoints: s.totalPoints, delta: s.totalPoints - (s.prevPoints ?? 0) }));

    topCleanSheets = allStats
      .filter((s) => s.player.position === "GK" && s.cleanSheets > 0)
      .sort((a, b) => b.cleanSheets - a.cleanSheets)
      .slice(0, 10)
      .map((s) => ({ playerId: s.playerId, playerName: s.player.name, cleanSheets: s.cleanSheets, delta: s.cleanSheets - (s.prevCleanSheets ?? 0) }));
  }

  const updatedAt = settings?.standingsUpdatedAt
    ? new Date(settings.standingsUpdatedAt).toLocaleString("nl-NL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" })
    : null;

  return (
    <div className="min-h-[calc(100vh-56px)] p-4 sm:p-8"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(14,40,80,0.6) 0%, #060b14 60%)" }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Tussenstand</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {updatedAt ? `Bijgewerkt op ${updatedAt}` : "Nog niet bijgewerkt"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <Link
            href="/tussenstand?tab=deelnemers"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "deelnemers"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Deelnemers
          </Link>
          <Link
            href="/tussenstand?tab=statistieken"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "statistieken"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Statistieken
          </Link>
        </div>

        {/* Tab: Deelnemers */}
        {activeTab === "deelnemers" && (
          <DeelnemersTable deelnemers={deelnemers} />
        )}

        {/* Tab: Statistieken */}
        {activeTab === "statistieken" && (
          <div className="space-y-4">
            {/* Topscorers */}
            <div className="bg-slate-900 neon-border rounded-2xl p-5">
              <h2 className="font-bold text-white mb-3 text-sm uppercase tracking-wide text-slate-400">Topscorers</h2>
              {topScorers.length === 0 ? (
                <p className="text-slate-500 text-sm">Nog geen doelpunten.</p>
              ) : (
                <ol className="space-y-2">
                  {topScorers.map((p, i) => (
                    <li key={p.playerId} className="flex items-center gap-3">
                      <span className="text-slate-600 w-5 text-right text-sm">{i + 1}</span>
                      <div className="flex-1">
                        <span className="font-medium text-white">{p.playerName}</span>
                        <span className="text-slate-500 text-xs ml-2">{TEAM_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                      </div>
                      <span className="font-bold text-cyan-400 w-8 text-right">{p.goals}</span>
                      <span className="w-12 text-right"><Delta value={p.delta} /></span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Meeste assists */}
            <div className="bg-slate-900 neon-border rounded-2xl p-5">
              <h2 className="font-bold text-sm uppercase tracking-wide text-slate-400 mb-3">Meeste assists</h2>
              {topAssists.length === 0 ? (
                <p className="text-slate-500 text-sm">Nog geen assists.</p>
              ) : (
                <ol className="space-y-2">
                  {topAssists.map((p, i) => (
                    <li key={p.playerId} className="flex items-center gap-3">
                      <span className="text-slate-600 w-5 text-right text-sm">{i + 1}</span>
                      <div className="flex-1">
                        <span className="font-medium text-white">{p.playerName}</span>
                        <span className="text-slate-500 text-xs ml-2">{TEAM_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                      </div>
                      <span className="font-bold text-cyan-400 w-8 text-right">{p.assists}</span>
                      <span className="w-12 text-right"><Delta value={p.delta} /></span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Meeste punten */}
            <div className="bg-slate-900 neon-border rounded-2xl p-5">
              <h2 className="font-bold text-sm uppercase tracking-wide text-slate-400 mb-3">Meeste punten (spelers)</h2>
              {topPoints.length === 0 ? (
                <p className="text-slate-500 text-sm">Nog geen punten verwerkt.</p>
              ) : (
                <ol className="space-y-2">
                  {topPoints.map((p, i) => (
                    <li key={p.playerId} className="flex items-center gap-3">
                      <span className="text-slate-600 w-5 text-right text-sm">{i + 1}</span>
                      <div className="flex-1">
                        <span className="font-medium text-white">{p.playerName}</span>
                        <span className="text-slate-500 text-xs ml-2">{TEAM_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                      </div>
                      <span className="font-bold text-cyan-400 w-8 text-right">{p.totalPoints}</span>
                      <span className="w-12 text-right"><Delta value={p.delta} /></span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Meeste clean sheets (keepers) */}
            <div className="bg-slate-900 neon-border rounded-2xl p-5">
              <h2 className="font-bold text-sm uppercase tracking-wide text-slate-400 mb-3">Meeste clean sheets (keepers)</h2>
              {topCleanSheets.length === 0 ? (
                <p className="text-slate-500 text-sm">Nog geen clean sheets.</p>
              ) : (
                <ol className="space-y-2">
                  {topCleanSheets.map((p, i) => (
                    <li key={p.playerId} className="flex items-center gap-3">
                      <span className="text-slate-600 w-5 text-right text-sm">{i + 1}</span>
                      <span className="flex-1 font-medium text-white">{p.playerName}</span>
                      <span className="font-bold text-cyan-400 w-8 text-right">{p.cleanSheets}</span>
                      <span className="w-12 text-right"><Delta value={p.delta} /></span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
