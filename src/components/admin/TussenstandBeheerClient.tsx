"use client";

import { useState, useEffect } from "react";
import StandingsPublishPanel from "@/components/tussenstand/StandingsPublishPanel";
import DeelnemersTable from "@/components/tussenstand/DeelnemersTable";

type DeelnemerStanding = {
  id: string;
  userName: string;
  totalPoints: number;
  prevPoints: number;
  delta: number;
};

type StatItem = { key: string; name: string; value: number; delta: number };
type TopStats = { topScorers: StatItem[]; topAssists: StatItem[]; topCleanSheets: StatItem[] };

type Visibility = { showTussenstand: boolean; showStatistieken: boolean };

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

export default function TussenstandBeheerClient({
  liveStandings,
  liveStats,
  hasSeason,
}: {
  liveStandings: DeelnemerStanding[];
  liveStats: TopStats;
  hasSeason: boolean;
}) {
  const [visibility, setVisibility] = useState<Visibility | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setVisibility({ showTussenstand: data.showTussenstand ?? true, showStatistieken: data.showStatistieken ?? true });
      });
  }, []);

  async function updateVisibility(field: keyof Visibility, value: boolean) {
    if (!visibility) return;
    const next = { ...visibility, [field]: value };
    setVisibility(next);
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg({ type: "err", text: "Opslaan mislukt" });
      setVisibility(visibility);
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-slate-900 neon-border rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-1">Zichtbaarheid voor deelnemers</h2>
        <p className="text-slate-500 text-sm mb-4">
          Master-schakelaars: staat een van deze uit, dan zien deelnemers een verborgen-melding in plaats van de pagina.
        </p>
        {!visibility ? (
          <p className="text-slate-500 text-sm">Laden...</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibility.showTussenstand}
                  onChange={(e) => updateVisibility("showTussenstand", e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
              <span className="text-sm font-medium text-slate-300">Tussenstand zichtbaar</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  visibility.showTussenstand
                    ? "bg-green-900/40 text-green-400 border border-green-500/30"
                    : "bg-red-900/40 text-red-400 border border-red-500/30"
                }`}
              >
                {visibility.showTussenstand ? "Zichtbaar" : "Verborgen"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibility.showStatistieken}
                  onChange={(e) => updateVisibility("showStatistieken", e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
              <span className="text-sm font-medium text-slate-300">Statistieken zichtbaar</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  visibility.showStatistieken
                    ? "bg-green-900/40 text-green-400 border border-green-500/30"
                    : "bg-red-900/40 text-red-400 border border-red-500/30"
                }`}
              >
                {visibility.showStatistieken ? "Zichtbaar" : "Verborgen"}
              </span>
            </div>
          </div>
        )}
        {msg && (
          <p className={`mt-3 text-sm px-3 py-2 rounded-lg border ${msg.type === "ok" ? "bg-green-900/20 text-green-400 border-green-500/30" : "bg-red-900/20 text-red-400 border-red-500/30"}`}>
            {msg.text}
          </p>
        )}
      </section>

      {hasSeason ? (
        <>
          <section>
            <div className="mb-2">
              <h2 className="text-base font-bold text-white">Live stand</h2>
              <p className="text-slate-500 text-sm">
                Altijd actueel, inclusief de laatst verwerkte wedstrijden. De +/- is t.o.v. de vorige verwerkronde — dit
                is dus wat deelnemers te zien krijgen zodra je publiceert, niet eerder.
              </p>
            </div>
            <DeelnemersTable deelnemers={liveStandings} />
          </section>
          <section>
            <div className="mb-2">
              <h2 className="text-base font-bold text-white">Live statistieken</h2>
              <p className="text-slate-500 text-sm">Topscorers, assists en clean sheets — ook dit wordt pas zichtbaar voor deelnemers na publiceren.</p>
            </div>
            <div className="bg-slate-900 neon-border rounded-2xl p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <StatColumn title="Topscorers" icon="⚽" color="text-amber-400" items={liveStats.topScorers} emptyText="Nog geen doelpunten." />
                <StatColumn title="Assists" icon="🅰️" color="text-cyan-400" items={liveStats.topAssists} emptyText="Nog geen assists." />
                <StatColumn title="Clean sheets" icon="🧤" color="text-green-400" items={liveStats.topCleanSheets} emptyText="Nog geen clean sheets." />
              </div>
            </div>
          </section>
          <StandingsPublishPanel liveStandings={liveStandings} />
        </>
      ) : (
        <p className="text-slate-500 text-sm">Geen actief seizoen gevonden.</p>
      )}
    </div>
  );
}
