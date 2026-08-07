import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [season, settings] = await Promise.all([
    prisma.season.findFirst({ where: { isActive: true } }),
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const [teamEntryCount, pendingMatches, waitingMatches, playerCount] = season
    ? await Promise.all([
        prisma.teamEntry.count({ where: { seasonId: season.id } }),
        prisma.match.count({ where: { seasonId: season.id, status: "PENDING" } }),
        prisma.match.count({ where: { seasonId: season.id, status: { in: ["APPROVED", "CORRECTION"] } } }),
        prisma.player.count({ where: { active: true } }),
      ])
    : [0, 0, 0, 0];

  const deadline = settings?.deadline ? new Date(settings.deadline) : null;
  const deadlinePassed = !!deadline && deadline <= new Date();
  const registrationOpen = (settings?.registrationOpen ?? false) && !deadlinePassed;

  const stats = [
    { label: "Seizoen", value: season?.name ?? "—" },
    { label: "Deelnemers", value: teamEntryCount },
    { label: "Wachten op goedkeuring", value: pendingMatches },
    { label: "Wachten op verwerking", value: waitingMatches },
    { label: "Actieve spelers", value: playerCount },
  ];

  const shortcuts = [
    { href: "/admin/wedstrijden", label: "Wedstrijden", description: "Goedkeuren, verwerken en beheren" },
    { href: "/admin/spelers", label: "Spelersbeheer", description: "Spelers en waardes beheren" },
    { href: "/admin/totw", label: "Team of the Week", description: "TOTW samenstellen" },
    { href: "/admin/gebruikers", label: "Deelnemers", description: "Ingeschreven teams beheren" },
    { href: "/admin/statistieken", label: "Statistieken", description: "Meest gekozen spelers en meer" },
    { href: "/admin/instellingen", label: "Spelinstellingen", description: "Budget, deadline, inschrijving" },
    { href: "/admin/puntensysteem", label: "Puntensysteem", description: "Puntentabel en bonusvragen" },
    { href: "/admin/teksten", label: "Teksten", description: "Spelregels, voorwaarden en meldingen" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 neon-border rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <h1 className="text-lg font-bold text-white">Dashboard</h1>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
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
