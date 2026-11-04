import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getContentMap } from "@/lib/content";
import { getVisibleStandingsPublication, type PublishedStandingsData, type StatItem } from "@/lib/standings";

function Delta({ value }: { value: number }) {
  if (!value || !isFinite(value)) return null;
  return (
    <span className={`text-xs font-semibold ${value > 0 ? "text-emerald-400" : "text-red-400"}`}>
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

function StatColumn({ title, icon, color, items, emptyText }: { title: string; icon: string; color: string; items: StatItem[]; emptyText: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 min-w-0">
      <h3 className={`font-bold text-xs sm:text-sm uppercase tracking-wide mb-2 sm:mb-3 ${color}`}>{icon} {title}</h3>
      {items.length === 0 ? (
        <p className="text-slate-500 text-xs">{emptyText}</p>
      ) : (
        <ol className="space-y-1.5">
          {items.map((it, i) => (
            <li key={it.key} className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-600 w-4 text-right shrink-0">{i + 1}</span>
              <span className="font-medium text-white flex-1 min-w-0 truncate">{it.name}</span>
              <span className="font-bold text-cyan-400 shrink-0">{it.value}</span>
              <span className="w-8 text-right shrink-0"><Delta value={it.delta} /></span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default async function StatistiekenPage() {
  const [session, settings] = await Promise.all([
    getSession(),
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const isAdmin = session?.role === "ADMIN";

  if (!isAdmin && settings?.showStatistieken === false) {
    const content = await getContentMap(["statistieken.hidden_message", "meldingen.whatsapp_follow"]);
    return (
      <div className="bg-slate-900 neon-border rounded-2xl p-8 text-center">
        <p className="text-slate-300 font-medium">{content["statistieken.hidden_message"]}</p>
        <p className="text-slate-500 text-sm mt-2">{content["meldingen.whatsapp_follow"]}</p>
      </div>
    );
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });

  // Zelfde publicatie als de deelnemerstussenstand — één publiceeractie werkt beide bij.
  const publication = season ? await getVisibleStandingsPublication(season.id) : null;
  const data = publication?.data as PublishedStandingsData | undefined;
  const stats = data?.stats;

  if (!publication || !stats) {
    return (
      <div className="bg-slate-900 neon-border rounded-2xl p-8 text-center">
        <p className="text-slate-300 font-medium">De statistieken zijn nog niet gepubliceerd.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-slate-500 text-xs">
        {`Laatste wijziging: ${new Date(publication.revealAt).toLocaleDateString("nl-NL", {
          day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam",
        })}`}
      </p>
      <div className="bg-slate-900 neon-border rounded-2xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <StatColumn title="Topscorers" icon="⚽" color="text-amber-400" items={stats.topScorers} emptyText="Nog geen doelpunten." />
          <StatColumn title="Assists" icon="🅰️" color="text-cyan-400" items={stats.topAssists} emptyText="Nog geen assists." />
          <StatColumn title="Clean sheets" icon="🧤" color="text-green-400" items={stats.topCleanSheets} emptyText="Nog geen clean sheets." />
        </div>
      </div>
    </div>
  );
}
