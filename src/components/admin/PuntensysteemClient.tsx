"use client";

import { useState, useEffect } from "react";

type PointsConfig = {
  id: string;
  label: string;
  gkPoints: number | null;
  defPoints: number | null;
  midPoints: number | null;
  attPoints: number | null;
  capPerMatch: number | null;
};

const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";

export default function PuntensysteemClient() {
  const [pointsConfig, setPointsConfig] = useState<PointsConfig[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [captainBonusPerWin, setCaptainBonusPerWin] = useState(5);
  const [pointsSaving, setPointsSaving] = useState(false);
  const [pointsMsg, setPointsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function loadPointsConfig() {
    setLoadingPoints(true);
    const [pointsRes, settingsRes] = await Promise.all([
      fetch("/api/admin/points-config"),
      fetch("/api/admin/settings"),
    ]);
    if (pointsRes.ok) setPointsConfig(await pointsRes.json());
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      setCaptainBonusPerWin(settings.captainBonusPerWin ?? 5);
    }
    setLoadingPoints(false);
  }

  async function savePointsConfig() {
    setPointsSaving(true);
    setPointsMsg(null);
    const [pointsRes] = await Promise.all([
      fetch("/api/admin/points-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pointsConfig),
      }),
      fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captainBonusPerWin: Number(captainBonusPerWin) }),
      }),
    ]);
    const data = await pointsRes.json();
    setPointsSaving(false);
    if (!pointsRes.ok) {
      setPointsMsg({ type: "err", text: data.error || "Opslaan mislukt" });
    } else {
      setPointsConfig(data);
      setPointsMsg({ type: "ok", text: "Puntensysteem opgeslagen" });
    }
  }

  function updatePointsCell(
    id: string,
    field: "gkPoints" | "defPoints" | "midPoints" | "attPoints" | "capPerMatch",
    value: string
  ) {
    setPointsConfig((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value === "" ? null : Number(value) } : c))
    );
  }

  useEffect(() => {
    loadPointsConfig();
  }, []);

  return (
    <div className="max-w-4xl">
      <section className="bg-slate-900 neon-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-5">Puntensysteem</h2>
        {loadingPoints ? (
          <p className="text-slate-500 text-sm">Laden...</p>
        ) : pointsConfig.length === 0 ? (
          <p className="text-slate-500 text-sm">Geen configuratie gevonden. Voer het seed script uit.</p>
        ) : (
          <div>
            <div className="overflow-x-auto mb-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-800">
                    <th className="pb-2 font-semibold">Actie</th>
                    <th className="pb-2 font-semibold text-center w-12">GK</th>
                    <th className="pb-2 font-semibold text-center w-12">DEF</th>
                    <th className="pb-2 font-semibold text-center w-12">MID</th>
                    <th className="pb-2 font-semibold text-center w-12">ATT</th>
                    <th className="pb-2 font-semibold text-center w-20">Max/wedstrijd</th>
                  </tr>
                </thead>
                <tbody>
                  {[...pointsConfig]
                    .sort((a, b) => {
                      const ORDER = [
                        "goal",
                        "penaltyGoal",
                        "assist",
                        "ownGoal",
                        "win",
                        "draw",
                        "yellowCard",
                        "redCard",
                        "goalsConceded",
                        "cleanSheet",
                      ];
                      return (ORDER.indexOf(a.id) ?? 99) - (ORDER.indexOf(b.id) ?? 99);
                    })
                    .map((cfg) => (
                      <tr key={cfg.id} className="border-b border-slate-800/60">
                        <td className="py-2 font-medium text-white">{cfg.label}</td>
                        {(["gkPoints", "defPoints", "midPoints", "attPoints"] as const).map((field) => (
                          <td key={field} className="py-2 text-center">
                            {cfg[field] === null &&
                            !["goal", "penaltyGoal", "assist", "ownGoal", "win", "draw", "yellowCard", "redCard"].includes(
                              cfg.id
                            ) ? (
                              <span className="text-slate-700 text-xs">N/v.t.</span>
                            ) : (
                              <input
                                type="number"
                                value={cfg[field] ?? ""}
                                onChange={(e) => updatePointsCell(cfg.id, field, e.target.value)}
                                className="w-10 sm:w-14 bg-slate-800 border border-slate-700 text-white rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                              />
                            )}
                          </td>
                        ))}
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            value={cfg.capPerMatch ?? ""}
                            onChange={(e) => updatePointsCell(cfg.id, "capPerMatch", e.target.value)}
                            placeholder="—"
                            title="Maximum aantal punten dat deze categorie per wedstrijd mag opleveren/kosten. Leeg = geen maximum."
                            className="w-14 bg-slate-800 border border-slate-700 text-white rounded px-1 py-1 text-xs text-center placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 -mt-3 mb-5">
              <strong className="text-slate-400">Max/wedstrijd</strong>: begrenst wat een categorie in één wedstrijd maximaal aan punten mag opleveren of kosten (bijv. bij tegendoelpunten: nooit meer dan -3, ook bij 4 of meer tegengoals). Leeg laten = geen grens.
            </p>

            <div className="flex items-center gap-3 mb-5 border-t border-slate-800 pt-4">
              <span className="text-sm font-medium text-slate-300">Aanvoerder bonus</span>
              <input
                type="number"
                min="0"
                value={captainBonusPerWin}
                onChange={(e) => setCaptainBonusPerWin(Number(e.target.value))}
                className="w-14 bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
              />
              <span className="text-xs text-slate-500">punten per overwinning (alleen als &apos;Aanvoerder verplicht&apos; aanstaat)</span>
            </div>

            {pointsMsg && (
              <p
                className={`text-sm px-3 py-2 rounded-lg mb-3 border ${
                  pointsMsg.type === "ok"
                    ? "bg-green-900/20 text-green-400 border-green-500/30"
                    : "bg-red-900/20 text-red-400 border-red-500/30"
                }`}
              >
                {pointsMsg.text}
              </p>
            )}
            <button onClick={savePointsConfig} disabled={pointsSaving} className={BTN_PRIMARY}>
              {pointsSaving ? "Opslaan..." : "Puntensysteem opslaan"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
