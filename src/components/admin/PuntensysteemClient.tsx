"use client";

import { useState, useEffect } from "react";

type PointsConfig = {
  id: string;
  label: string;
  gkPoints: number | null;
  defPoints: number | null;
  midPoints: number | null;
  attPoints: number | null;
};

const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";

export default function PuntensysteemClient() {
  const [pointsConfig, setPointsConfig] = useState<PointsConfig[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [pointsSaving, setPointsSaving] = useState(false);
  const [pointsMsg, setPointsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function loadPointsConfig() {
    setLoadingPoints(true);
    const res = await fetch("/api/admin/points-config");
    if (res.ok) setPointsConfig(await res.json());
    setLoadingPoints(false);
  }

  async function savePointsConfig() {
    setPointsSaving(true);
    setPointsMsg(null);
    const res = await fetch("/api/admin/points-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pointsConfig),
    });
    const data = await res.json();
    setPointsSaving(false);
    if (!res.ok) {
      setPointsMsg({ type: "err", text: data.error || "Opslaan mislukt" });
    } else {
      setPointsConfig(data);
      setPointsMsg({ type: "ok", text: "Puntentabel opgeslagen" });
    }
  }

  function updatePointsCell(
    id: string,
    field: "gkPoints" | "defPoints" | "midPoints" | "attPoints",
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
                      </tr>
                    ))}
                </tbody>
              </table>
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
              {pointsSaving ? "Opslaan..." : "Puntentabel opslaan"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
