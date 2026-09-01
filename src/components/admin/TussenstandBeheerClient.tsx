"use client";

import { useState, useEffect } from "react";
import StandingsPublishPanel from "@/components/tussenstand/StandingsPublishPanel";

type DeelnemerStanding = {
  id: string;
  userName: string;
  totalPoints: number;
  prevPoints: number;
  delta: number;
};

type Visibility = { showTussenstand: boolean; showStatistieken: boolean };

export default function TussenstandBeheerClient({
  liveStandings,
  hasSeason,
}: {
  liveStandings: DeelnemerStanding[];
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
        <StandingsPublishPanel liveStandings={liveStandings} />
      ) : (
        <p className="text-slate-500 text-sm">Geen actief seizoen gevonden.</p>
      )}
    </div>
  );
}
