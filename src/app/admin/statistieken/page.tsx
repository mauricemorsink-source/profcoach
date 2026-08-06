import { prisma } from "@/lib/prisma";

const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};
const POSITION_LABEL: Record<string, string> = {
  GK: "Doelman", DEF: "Verdediger", MID: "Middenvelder", ATT: "Aanvaller",
};
const POSITION_ORDER = ["GK", "DEF", "MID", "ATT"] as const;

type PlayerLite = { id: string; name: string; clubTeam: string; position: string; value: number };
type PredPlayer = { id: string; name: string; clubTeam: string };

type ListItem = { key: string; rank: number; primary: string; secondary?: string; value: string };

function RankedList({ items, emptyText }: { items: ListItem[]; emptyText: string }) {
  if (items.length === 0) return <p className="text-slate-500 text-sm">{emptyText}</p>;
  return (
    <ol className="space-y-2">
      {items.map((it) => (
        <li key={it.key} className="flex items-center gap-2">
          <span className="text-slate-600 w-5 text-right text-sm shrink-0">{it.rank}</span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white truncate">{it.primary}</div>
            {it.secondary && <div className="text-slate-500 text-xs truncate">{it.secondary}</div>}
          </div>
          <span className="font-bold text-cyan-400 shrink-0 whitespace-nowrap">{it.value}</span>
        </li>
      ))}
    </ol>
  );
}

function StatCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 neon-border rounded-2xl p-5">
      <h2 className="font-bold text-sm uppercase tracking-wide text-slate-400 mb-0.5">{title}</h2>
      <p className="text-xs text-slate-600 mb-3">{hint ?? " "}</p>
      {children}
    </div>
  );
}

export default async function AdminStatistiekenPage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } });

  if (!season) {
    return <p className="text-slate-500 text-sm">Geen actief seizoen gevonden.</p>;
  }

  const [entries, activePlayers] = await Promise.all([
    prisma.teamEntry.findMany({
      where: { seasonId: season.id },
      include: {
        formation: { select: { code: true } },
        players: { include: { player: { select: { id: true, name: true, clubTeam: true, position: true, value: true } } } },
        prediction: {
          include: {
            topScorer: { select: { id: true, name: true, clubTeam: true } },
            assistKoning: { select: { id: true, name: true, clubTeam: true } },
          },
        },
      },
    }),
    prisma.player.findMany({
      where: { active: true },
      select: { id: true, name: true, clubTeam: true, position: true, value: true },
    }),
  ]);

  const totalEntries = entries.length;
  const playerById = new Map<string, PlayerLite>(activePlayers.map((p) => [p.id, p]));

  // Pick counts (hoe vaak elke speler in een team zit)
  const pickCounts = new Map<string, number>();
  for (const e of entries) {
    for (const tp of e.players) {
      pickCounts.set(tp.playerId, (pickCounts.get(tp.playerId) ?? 0) + 1);
    }
  }

  const toItems = (rows: { player: PlayerLite | PredPlayer; count: number }[]): ListItem[] =>
    rows.map((r, i) => ({
      key: r.player.id,
      rank: i + 1,
      primary: r.player.name,
      secondary: TEAM_LABEL[r.player.clubTeam] ?? r.player.clubTeam,
      value: `${r.count}x`,
    }));

  const mostPicked = [...pickCounts.entries()]
    .map(([playerId, count]) => ({ player: playerById.get(playerId), count }))
    .filter((x): x is { player: PlayerLite; count: number } => !!x.player)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const leastPicked = [...pickCounts.entries()]
    .filter(([, count]) => count > 0)
    .map(([playerId, count]) => ({ player: playerById.get(playerId), count }))
    .filter((x): x is { player: PlayerLite; count: number } => !!x.player)
    .sort((a, b) => a.count - b.count)
    .slice(0, 5);

  const neverPickedAll = activePlayers.filter((p) => !pickCounts.has(p.id)).sort((a, b) => b.value - a.value);
  const neverPicked = neverPickedAll.slice(0, 10);

  // Vaakst gekozen aanvoerder
  const captainCounts = new Map<string, number>();
  for (const e of entries) {
    if (e.captainSlot == null) continue;
    const cp = e.players.find((tp) => tp.slotIndex === e.captainSlot);
    if (cp) captainCounts.set(cp.playerId, (captainCounts.get(cp.playerId) ?? 0) + 1);
  }
  const topCaptains = [...captainCounts.entries()]
    .map(([playerId, count]) => ({ player: playerById.get(playerId), count }))
    .filter((x): x is { player: PlayerLite; count: number } => !!x.player)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Voorspellingen: topscorer & assistkoning
  const topScorerCounts = new Map<string, { count: number; player: PredPlayer }>();
  const assistKoningCounts = new Map<string, { count: number; player: PredPlayer }>();
  for (const e of entries) {
    const pred = e.prediction;
    if (pred?.topScorer) {
      const cur = topScorerCounts.get(pred.topScorer.id);
      topScorerCounts.set(pred.topScorer.id, { count: (cur?.count ?? 0) + 1, player: pred.topScorer });
    }
    if (pred?.assistKoning) {
      const cur = assistKoningCounts.get(pred.assistKoning.id);
      assistKoningCounts.set(pred.assistKoning.id, { count: (cur?.count ?? 0) + 1, player: pred.assistKoning });
    }
  }
  const topPredictedScorers = [...topScorerCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  const topPredictedAssists = [...assistKoningCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  // Populairste formatie
  const formationCounts = new Map<string, number>();
  for (const e of entries) {
    formationCounts.set(e.formation.code, (formationCounts.get(e.formation.code) ?? 0) + 1);
  }
  const topFormations = [...formationCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Populairste elftal (gemiddeld aantal keer gekozen per speler in dat elftal)
  const rosterSizeByTeam = new Map<string, number>();
  for (const p of activePlayers) {
    rosterSizeByTeam.set(p.clubTeam, (rosterSizeByTeam.get(p.clubTeam) ?? 0) + 1);
  }
  const picksByTeam = new Map<string, number>();
  for (const [playerId, count] of pickCounts) {
    const p = playerById.get(playerId);
    if (!p) continue;
    picksByTeam.set(p.clubTeam, (picksByTeam.get(p.clubTeam) ?? 0) + count);
  }
  const teamPopularity = [...rosterSizeByTeam.entries()]
    .map(([team, roster]) => {
      const picks = picksByTeam.get(team) ?? 0;
      return { team, picks, roster, avg: roster > 0 ? picks / roster : 0 };
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  // Populairste speler per positie
  const byPosition: Record<string, { player: PlayerLite; count: number }[]> = {};
  for (const pos of POSITION_ORDER) {
    byPosition[pos] = [...pickCounts.entries()]
      .map(([playerId, count]) => ({ player: playerById.get(playerId), count }))
      .filter((x): x is { player: PlayerLite; count: number } => !!x.player && x.player.position === pos)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 neon-border rounded-2xl p-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-white">Team-statistieken</h1>
          <p className="text-slate-500 text-sm mt-0.5">Live berekend over alle ingediende teams van {season.name}.</p>
        </div>
        <span className="text-sm text-slate-400 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
          {totalEntries} team{totalEntries !== 1 ? "s" : ""} ingediend
        </span>
      </div>

      {totalEntries === 0 ? (
        <p className="text-slate-500 text-sm">Nog geen teams ingediend.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard title="Meest gekozen spelers">
              <RankedList items={toItems(mostPicked)} emptyText="Nog geen selecties." />
            </StatCard>

            <StatCard title="Minst gekozen spelers" hint="Onder spelers die minstens 1x gekozen zijn">
              <RankedList items={toItems(leastPicked)} emptyText="Nog geen selecties." />
            </StatCard>

            <StatCard title="Vaakst gekozen aanvoerder">
              <RankedList items={toItems(topCaptains)} emptyText="Nog geen aanvoerders gekozen." />
            </StatCard>

            <StatCard title="Populairste formatie">
              <RankedList
                items={topFormations.map(([code, count], i) => ({ key: code, rank: i + 1, primary: code, value: `${count}x` }))}
                emptyText="Nog geen teams ingediend."
              />
            </StatCard>

            <StatCard title="Meest voorspelde topscorer">
              <RankedList items={toItems(topPredictedScorers)} emptyText="Nog geen voorspellingen." />
            </StatCard>

            <StatCard title="Meest voorspelde assistkoning">
              <RankedList items={toItems(topPredictedAssists)} emptyText="Nog geen voorspellingen." />
            </StatCard>

            <StatCard title="Populairste elftal" hint="Gemiddeld aantal keer gekozen per speler in dat elftal">
              <RankedList
                items={teamPopularity.map((t, i) => ({
                  key: t.team,
                  rank: i + 1,
                  primary: TEAM_LABEL[t.team] ?? t.team,
                  secondary: `${t.picks} picks · ${t.roster} spelers`,
                  value: `${t.avg.toFixed(1)}x gem.`,
                }))}
                emptyText="Nog geen selecties."
              />
            </StatCard>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">Populairste speler per positie</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {POSITION_ORDER.map((pos) => (
                <StatCard key={pos} title={POSITION_LABEL[pos]}>
                  <RankedList items={toItems(byPosition[pos])} emptyText="Nog geen selecties." />
                </StatCard>
              ))}
            </div>
          </div>

          <StatCard
            title="Nooit gekozen spelers"
            hint={`${neverPickedAll.length} van de ${activePlayers.length} actieve spelers nog niet gekozen`}
          >
            {neverPicked.length === 0 ? (
              <p className="text-slate-500 text-sm">Alle actieve spelers zijn minstens 1x gekozen.</p>
            ) : (
              <>
                <ol className="space-y-2">
                  {neverPicked.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <span className="text-slate-600 w-5 text-right text-sm shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{p.name}</div>
                        <div className="text-slate-500 text-xs truncate">
                          {TEAM_LABEL[p.clubTeam] ?? p.clubTeam} · {POSITION_LABEL[p.position] ?? p.position}
                        </div>
                      </div>
                      <span className="font-bold text-slate-500 shrink-0">€{p.value}</span>
                    </li>
                  ))}
                </ol>
                {neverPickedAll.length > neverPicked.length && (
                  <p className="text-xs text-slate-600 mt-2">
                    + {neverPickedAll.length - neverPicked.length} meer (op waarde gesorteerd, top 10 getoond)
                  </p>
                )}
              </>
            )}
          </StatCard>
        </>
      )}
    </div>
  );
}
