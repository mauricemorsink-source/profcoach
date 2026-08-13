import Image from "next/image";
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

// Compacte variant voor het deelbare 3-koloms blok: geen teamnaam, tekst wrapt i.p.v. af te knippen.
function CompactRankedList({ items, emptyText }: { items: ListItem[]; emptyText: string }) {
  if (items.length === 0) return <p className="text-slate-500 text-sm">{emptyText}</p>;
  return (
    <ol className="space-y-2">
      {items.map((it) => (
        <li key={it.key} className="flex items-start gap-1.5 text-sm leading-tight">
          <span className="text-slate-600 shrink-0 w-4 text-right">{it.rank}</span>
          <span className="font-medium text-white flex-1 min-w-0 break-words">{it.primary}</span>
          <span className="font-bold text-cyan-400 shrink-0">{it.value}</span>
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

  const [entries, activePlayers, goalsAgg, yellowCardsAgg, topScorerStats, topAssistStats, topCleanSheetStats] = await Promise.all([
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
    prisma.match.aggregate({
      where: { seasonId: season.id, status: { in: ["APPROVED", "PROCESSED"] } },
      _sum: { goalsScored: true },
    }),
    prisma.matchPerformance.aggregate({
      where: { match: { seasonId: season.id, status: { in: ["APPROVED", "PROCESSED"] } } },
      _sum: { yellowCards: true },
    }),
    prisma.playerSeasonStats.findMany({
      where: { seasonId: season.id, goals: { gt: 0 } },
      orderBy: { goals: "desc" },
      take: 10,
      include: { player: { select: { name: true, clubTeam: true } } },
    }),
    prisma.playerSeasonStats.findMany({
      where: { seasonId: season.id, assists: { gt: 0 } },
      orderBy: { assists: "desc" },
      take: 10,
      include: { player: { select: { name: true, clubTeam: true } } },
    }),
    prisma.playerSeasonStats.findMany({
      where: { seasonId: season.id, cleanSheets: { gt: 0 }, player: { position: "GK" } },
      orderBy: { cleanSheets: "desc" },
      take: 7,
      include: { player: { select: { name: true, clubTeam: true } } },
    }),
  ]);

  const totalGoalsScored = goalsAgg._sum.goalsScored ?? 0;
  const totalYellowCards = yellowCardsAgg._sum.yellowCards ?? 0;

  const topScorerItems: ListItem[] = topScorerStats.map((s, i) => ({
    key: s.playerId, rank: i + 1, primary: s.player.name,
    secondary: TEAM_LABEL[s.player.clubTeam] ?? s.player.clubTeam, value: `${s.goals}`,
  }));
  const topAssistItems: ListItem[] = topAssistStats.map((s, i) => ({
    key: s.playerId, rank: i + 1, primary: s.player.name,
    secondary: TEAM_LABEL[s.player.clubTeam] ?? s.player.clubTeam, value: `${s.assists}`,
  }));
  const topCleanSheetItems: ListItem[] = topCleanSheetStats.map((s, i) => ({
    key: s.playerId, rank: i + 1, primary: s.player.name,
    secondary: TEAM_LABEL[s.player.clubTeam] ?? s.player.clubTeam, value: `${s.cleanSheets}`,
  }));

  const totalEntries = entries.length;

  // playerById moet ELKE ooit gekozen speler kunnen herkennen, ook als die inmiddels
  // inactief is gezet (bijv. een verouderd dubbel spelerrecord) — anders vallen
  // gekozen spelers stilletjes weg uit alle onderstaande tellingen.
  const playerById = new Map<string, PlayerLite>(activePlayers.map((p) => [p.id, p]));
  for (const e of entries) {
    for (const tp of e.players) {
      if (!playerById.has(tp.player.id)) playerById.set(tp.player.id, tp.player);
    }
  }

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

  // Populairste elftal (gemiddeld aantal spelers gekozen uit dat elftal per ingediend team;
  // ligt door de spelregel "1 tot 2 spelers per elftal verplicht" altijd tussen 1 en 2)
  const picksByTeam = new Map<string, number>();
  for (const [playerId, count] of pickCounts) {
    const p = playerById.get(playerId);
    if (!p) continue;
    picksByTeam.set(p.clubTeam, (picksByTeam.get(p.clubTeam) ?? 0) + count);
  }
  const clubTeams = [...new Set(activePlayers.map((p) => p.clubTeam))];
  const teamPopularity = clubTeams
    .map((team) => {
      const picks = picksByTeam.get(team) ?? 0;
      return { team, picks, avg: totalEntries > 0 ? picks / totalEntries : 0 };
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

      {/* Deelbaar 2x2-blok: topscorers, assists, clean sheets — bedoeld om als vierkant/rechthoek te screenshotten */}
      <div
        className="bg-slate-900 neon-border rounded-2xl p-5 sm:p-6"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(14,40,80,0.6) 0%, #0b1120 70%)" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <Image src="/file-removebg-preview.png" alt="ProfCoach" width={40} height={40} className="object-contain shrink-0" />
          <div>
            <p className="font-black text-white text-lg leading-tight">ProfCoach</p>
            <p className="text-slate-500 text-xs">Tussenstand · {season.name}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 min-w-0">
            <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide text-amber-400 mb-2 sm:mb-3">⚽ Topscorers</h3>
            <CompactRankedList items={topScorerItems} emptyText="Nog geen doelpunten dit seizoen." />
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 min-w-0">
            <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide text-cyan-400 mb-2 sm:mb-3">🅰️ Assists</h3>
            <CompactRankedList items={topAssistItems} emptyText="Nog geen assists dit seizoen." />
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 min-w-0">
            <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide text-green-400 mb-2 sm:mb-3">🧤 Clean sheets</h3>
            <CompactRankedList items={topCleanSheetItems} emptyText="Nog geen clean sheets dit seizoen." />
          </div>
        </div>
      </div>

      {totalEntries === 0 ? (
        <p className="text-slate-500 text-sm">Nog geen teams ingediend.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard title="Meest gekozen spelers">
              <RankedList items={toItems(mostPicked)} emptyText="Nog geen selecties." />
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

            <StatCard title="Populairste elftal" hint="Gemiddeld aantal spelers gekozen uit dat elftal per ingediend team (ligt tussen 1 en 2)">
              <RankedList
                items={teamPopularity.map((t, i) => ({
                  key: t.team,
                  rank: i + 1,
                  primary: TEAM_LABEL[t.team] ?? t.team,
                  secondary: `${t.picks} picks totaal`,
                  value: `${t.avg.toFixed(2)}x gem.`,
                }))}
                emptyText="Nog geen selecties."
              />
            </StatCard>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">Bonusvragen — stand van zaken</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 neon-border rounded-2xl p-4">
                <p className="text-2xl font-black text-white">{totalGoalsScored}</p>
                <p className="text-xs text-slate-500 mt-0.5">Doelpunten voor Rietmolen (incl. eigen goals tegenstanders en spelers buiten het spel)</p>
              </div>
              <div className="bg-slate-900 neon-border rounded-2xl p-4">
                <p className="text-2xl font-black text-white">{totalYellowCards}</p>
                <p className="text-xs text-slate-500 mt-0.5">Gele kaarten Rietmolen</p>
              </div>
            </div>
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
        </>
      )}
    </div>
  );
}
