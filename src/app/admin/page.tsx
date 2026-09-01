import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [season, settings] = await Promise.all([
    prisma.season.findFirst({ where: { isActive: true } }),
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const [teamEntryCount, paidTeamEntryCount, totalMatches, pendingMatches, waitingMatches, processedMatches, goalsAgg, yellowCardsAgg] = season
    ? await Promise.all([
        prisma.teamEntry.count({ where: { seasonId: season.id } }),
        prisma.teamEntry.count({ where: { seasonId: season.id, betaald: true } }),
        prisma.match.count({ where: { seasonId: season.id } }),
        prisma.match.count({ where: { seasonId: season.id, status: "PENDING" } }),
        prisma.match.count({ where: { seasonId: season.id, status: "APPROVED" } }),
        prisma.match.count({ where: { seasonId: season.id, status: "PROCESSED" } }),
        prisma.match.aggregate({
          where: { seasonId: season.id, status: { in: ["APPROVED", "PROCESSED"] } },
          _sum: { goalsScored: true },
        }),
        prisma.matchPerformance.aggregate({
          where: { match: { seasonId: season.id, status: { in: ["APPROVED", "PROCESSED"] } } },
          _sum: { yellowCards: true },
        }),
      ])
    : [0, 0, 0, 0, 0, 0, { _sum: { goalsScored: 0 } }, { _sum: { yellowCards: 0 } }];

  const totalGoalsScored = goalsAgg._sum.goalsScored ?? 0;
  const totalYellowCards = yellowCardsAgg._sum.yellowCards ?? 0;

  const deadline = settings?.deadline ? new Date(settings.deadline) : null;
  const deadlinePassed = !!deadline && deadline <= new Date();
  const registrationOpen = (settings?.registrationOpen ?? false) && !deadlinePassed;

  const deelnemersStats = [
    { label: "Deelnemers", value: teamEntryCount },
    { label: "Deelnemers betaald", value: paidTeamEntryCount },
  ];

  const wedstrijdenStats = [
    { label: "Totaal aantal wedstrijden", value: totalMatches },
    { label: "Wachtend op goedkeuring", value: pendingMatches },
    { label: "Wachtend op verwerking", value: waitingMatches },
    { label: "Verwerkt", value: processedMatches },
  ];

  const bonusvraagStats = [
    { label: "Doelpunten voor Rietmolen", value: totalGoalsScored },
    { label: "Gele kaarten Rietmolen", value: totalYellowCards },
  ];

  const shortcuts = [
    { href: "/admin/instellingen", label: "Spelinstellingen", description: "Budget, deadline, inschrijving, puntensysteem" },
    { href: "/admin/content", label: "Content", description: "Spelregels, voorwaarden en meldingen" },
    { href: "/admin/wedstrijden", label: "Wedstrijden", description: "Goedkeuren, verwerken en beheren" },
    { href: "/admin/spelers", label: "Spelersbeheer", description: "Spelers en waardes beheren" },
    { href: "/admin/totw", label: "Team of the Week", description: "TOTW samenstellen" },
    { href: "/admin/gebruikers", label: "Deelnemers", description: "Ingeschreven teams beheren" },
    { href: "/admin/statistieken", label: "Statistieken", description: "Meest gekozen spelers en meer" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 neon-border rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h1 className="text-lg font-bold text-white">Dashboard</h1>
            <p className="text-slate-500 text-xs mt-0.5">Seizoen {season?.name ?? "—"}</p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              registrationOpen
                ? "bg-green-900/40 text-green-400 border border-green-500/30"
                : "bg-red-900/40 text-red-400 border border-red-500/30"
            }`}
          >
            Inschrijving {registrationOpen ? "open" : "gesloten"}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Deelnemers</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {deelnemersStats.map((s) => (
                <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Wedstrijden</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {wedstrijdenStats.map((s) => (
                <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Bonusvragen</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {bonusvraagStats.map((s) => (
                <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">Snelkoppelingen</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="bg-slate-900 neon-border rounded-2xl p-4 hover:border-cyan-500/40 transition-colors block"
            >
              <p className="font-bold text-white text-sm">{s.label}</p>
              <p className="text-slate-500 text-xs mt-1">{s.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
