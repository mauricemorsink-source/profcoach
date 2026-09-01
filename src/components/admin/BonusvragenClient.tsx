"use client";

import { useState, useEffect } from "react";

type Player = {
  id: string;
  name: string;
  shortName?: string | null;
  position: "GK" | "DEF" | "MID" | "ATT";
  clubTeam: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE" | "DAMES";
  altTeam?: string | null;
  value: number;
};

type PredConfig = {
  topScorerId: string | null;
  topScorer: { id: string; name: string } | null;
  assistKoningId: string | null;
  assistKoning: { id: string; name: string } | null;
  yellowCardsMin: number | null;
  yellowCardsMax: number | null;
  totalGoalsMin: number | null;
  totalGoalsMax: number | null;
  topScorerPoints: number;
  assistKoningPoints: number;
  yellowCardsPoints: number;
  totalGoalsPoints: number;
  showPointsToParticipants: boolean;
  processed: boolean;
  processedAt: string | null;
};

type PredPreview = {
  config: PredConfig;
  total: number;
  topScorerCount: number | null;
  assistKoningCount: number | null;
  yellowCardsCount: number | null;
  totalGoalsCount: number | null;
};

const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700";

export default function BonusvragenClient() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [predConfig, setPredConfig] = useState<PredConfig | null>(null);
  const [loadingPredConfig, setLoadingPredConfig] = useState(false);
  const [predConfigSaving, setPredConfigSaving] = useState(false);
  const [predConfigMsg, setPredConfigMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [predProcessing, setPredProcessing] = useState(false);
  const [predConfigForm, setPredConfigForm] = useState({
    topScorerId: "",
    assistKoningId: "",
    yellowCardsMin: "",
    yellowCardsMax: "",
    totalGoalsMin: "",
    totalGoalsMax: "",
    topScorerPoints: "5",
    assistKoningPoints: "5",
    yellowCardsPoints: "5",
    totalGoalsPoints: "5",
    showPointsToParticipants: false,
  });
  const [predPlayerSearch, setPredPlayerSearch] = useState("");
  const [predActiveField, setPredActiveField] = useState<"topscorer" | "assistkoning" | null>(null);
  const [showPredPreview, setShowPredPreview] = useState(false);
  const [loadingPredPreview, setLoadingPredPreview] = useState(false);
  const [predPreview, setPredPreview] = useState<PredPreview | null>(null);

  async function loadPlayers() {
    const res = await fetch("/api/admin/players");
    if (res.ok) setPlayers(await res.json());
  }

  async function loadPredConfig() {
    setLoadingPredConfig(true);
    const res = await fetch("/api/admin/prediction-config");
    if (res.ok) {
      const data = await res.json();
      setPredConfig(data);
      setPredConfigForm({
        topScorerId: data.topScorerId ?? "",
        assistKoningId: data.assistKoningId ?? "",
        yellowCardsMin: data.yellowCardsMin != null ? String(data.yellowCardsMin) : "",
        yellowCardsMax: data.yellowCardsMax != null ? String(data.yellowCardsMax) : "",
        totalGoalsMin: data.totalGoalsMin != null ? String(data.totalGoalsMin) : "",
        totalGoalsMax: data.totalGoalsMax != null ? String(data.totalGoalsMax) : "",
        topScorerPoints: String(data.topScorerPoints ?? 5),
        assistKoningPoints: String(data.assistKoningPoints ?? 5),
        yellowCardsPoints: String(data.yellowCardsPoints ?? 5),
        totalGoalsPoints: String(data.totalGoalsPoints ?? 5),
        showPointsToParticipants: data.showPointsToParticipants ?? false,
      });
    }
    setLoadingPredConfig(false);
  }

  async function savePredConfig() {
    setPredConfigSaving(true);
    setPredConfigMsg(null);
    const res = await fetch("/api/admin/prediction-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topScorerId: predConfigForm.topScorerId || null,
        assistKoningId: predConfigForm.assistKoningId || null,
        yellowCardsMin: predConfigForm.yellowCardsMin !== "" ? Number(predConfigForm.yellowCardsMin) : null,
        yellowCardsMax: predConfigForm.yellowCardsMax !== "" ? Number(predConfigForm.yellowCardsMax) : null,
        totalGoalsMin: predConfigForm.totalGoalsMin !== "" ? Number(predConfigForm.totalGoalsMin) : null,
        totalGoalsMax: predConfigForm.totalGoalsMax !== "" ? Number(predConfigForm.totalGoalsMax) : null,
        topScorerPoints: Number(predConfigForm.topScorerPoints) || 5,
        assistKoningPoints: Number(predConfigForm.assistKoningPoints) || 5,
        yellowCardsPoints: Number(predConfigForm.yellowCardsPoints) || 5,
        totalGoalsPoints: Number(predConfigForm.totalGoalsPoints) || 5,
        showPointsToParticipants: predConfigForm.showPointsToParticipants,
      }),
    });
    const data = await res.json();
    setPredConfigSaving(false);
    if (!res.ok) {
      setPredConfigMsg({ type: "err", text: data.error || "Opslaan mislukt" });
      return;
    }
    setPredConfig(data);
    setPredConfigMsg({ type: "ok", text: "Opgeslagen" });
  }

  async function openPredPreview() {
    setLoadingPredPreview(true);
    setShowPredPreview(true);
    setPredPreview(null);
    const res = await fetch("/api/admin/prediction-config/preview");
    if (res.ok) setPredPreview(await res.json());
    setLoadingPredPreview(false);
  }

  async function processBonusPoints() {
    setPredProcessing(true);
    setPredConfigMsg(null);
    const res = await fetch("/api/admin/prediction-config/process", { method: "POST" });
    const data = await res.json();
    setPredProcessing(false);
    setShowPredPreview(false);
    if (!res.ok) {
      setPredConfigMsg({ type: "err", text: data.error || "Verwerken mislukt" });
      return;
    }
    setPredConfigMsg({
      type: "ok",
      text: `Verwerkt: ${data.processed} van ${data.total} deelnemers kregen bonuspunten`,
    });
    loadPredConfig();
  }

  async function retractBonusPoints() {
    setPredProcessing(true);
    setPredConfigMsg(null);
    const res = await fetch("/api/admin/prediction-config/retract", { method: "POST" });
    const data = await res.json();
    setPredProcessing(false);
    if (!res.ok) {
      setPredConfigMsg({ type: "err", text: data.error || "Intrekken mislukt" });
      return;
    }
    setPredConfigMsg({ type: "ok", text: "Bonuspunten ingetrokken" });
    loadPredConfig();
  }

  useEffect(() => {
    loadPlayers();
    loadPredConfig();
  }, []);

  return (
    <div className="max-w-4xl">
      <section className="bg-slate-900 neon-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Bonusvragen</h2>
          {predConfig?.processed && predConfig.processedAt && (
            <span className="text-xs text-green-400 bg-green-900/20 border border-green-500/30 px-3 py-1 rounded-full font-semibold">
              Verwerkt op {new Date(predConfig.processedAt).toLocaleDateString("nl-NL")}
            </span>
          )}
        </div>

        {loadingPredConfig ? (
          <p className="text-slate-500 text-sm">Laden...</p>
        ) : (
          <>
            {/* Vraag 1: Topscorer */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Topscorer</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Punten:</label>
                  <input
                    type="number"
                    min="0"
                    value={predConfigForm.topScorerPoints}
                    onChange={(e) => setPredConfigForm((f) => ({ ...f, topScorerPoints: e.target.value }))}
                    className="w-16 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                  />
                </div>
              </div>
              {predActiveField === "topscorer" ? (
                <div className="space-y-1.5">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Zoek speler..."
                    value={predPlayerSearch}
                    onChange={(e) => setPredPlayerSearch(e.target.value)}
                    className={INPUT}
                  />
                  <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/60">
                    {players
                      .filter(
                        (p) =>
                          !predPlayerSearch.trim() ||
                          p.name.toLowerCase().includes(predPlayerSearch.toLowerCase())
                      )
                      .slice(0, 30)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setPredConfigForm((f) => ({ ...f, topScorerId: p.id }));
                            setPredActiveField(null);
                            setPredPlayerSearch("");
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center justify-between ${
                            predConfigForm.topScorerId === p.id ? "text-cyan-400" : "text-white"
                          }`}
                        >
                          <span>{p.name}</span>
                          <span className="text-slate-500 text-xs">{TEAM_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                        </button>
                      ))}
                  </div>
                  <button
                    onClick={() => {
                      setPredActiveField(null);
                      setPredPlayerSearch("");
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Annuleer
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setPredActiveField("topscorer");
                    setPredPlayerSearch("");
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    predConfigForm.topScorerId
                      ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                      : "border-slate-600 bg-slate-900/50 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {predConfigForm.topScorerId
                    ? players.find((p) => p.id === predConfigForm.topScorerId)?.name ?? "Gekozen"
                    : "Kies de topscorer..."}
                </button>
              )}
            </div>

            {/* Vraag 2: Assistkoning */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Assistkoning</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Punten:</label>
                  <input
                    type="number"
                    min="0"
                    value={predConfigForm.assistKoningPoints}
                    onChange={(e) =>
                      setPredConfigForm((f) => ({ ...f, assistKoningPoints: e.target.value }))
                    }
                    className="w-16 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                  />
                </div>
              </div>
              {predActiveField === "assistkoning" ? (
                <div className="space-y-1.5">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Zoek speler..."
                    value={predPlayerSearch}
                    onChange={(e) => setPredPlayerSearch(e.target.value)}
                    className={INPUT}
                  />
                  <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/60">
                    {players
                      .filter(
                        (p) =>
                          !predPlayerSearch.trim() ||
                          p.name.toLowerCase().includes(predPlayerSearch.toLowerCase())
                      )
                      .slice(0, 30)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setPredConfigForm((f) => ({ ...f, assistKoningId: p.id }));
                            setPredActiveField(null);
                            setPredPlayerSearch("");
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center justify-between ${
                            predConfigForm.assistKoningId === p.id ? "text-cyan-400" : "text-white"
                          }`}
                        >
                          <span>{p.name}</span>
                          <span className="text-slate-500 text-xs">{TEAM_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                        </button>
                      ))}
                  </div>
                  <button
                    onClick={() => {
                      setPredActiveField(null);
                      setPredPlayerSearch("");
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Annuleer
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setPredActiveField("assistkoning");
                    setPredPlayerSearch("");
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    predConfigForm.assistKoningId
                      ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                      : "border-slate-600 bg-slate-900/50 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {predConfigForm.assistKoningId
                    ? players.find((p) => p.id === predConfigForm.assistKoningId)?.name ?? "Gekozen"
                    : "Kies de assistkoning..."}
                </button>
              )}
            </div>

            {/* Vraag 3: Gele kaarten */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Totaal gele kaarten</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Punten:</label>
                  <input
                    type="number"
                    min="0"
                    value={predConfigForm.yellowCardsPoints}
                    onChange={(e) =>
                      setPredConfigForm((f) => ({ ...f, yellowCardsPoints: e.target.value }))
                    }
                    className="w-16 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={predConfigForm.yellowCardsMin}
                  onChange={(e) => setPredConfigForm((f) => ({ ...f, yellowCardsMin: e.target.value }))}
                  className={INPUT + " w-24"}
                />
                <span className="text-slate-500 text-sm">t/m</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={predConfigForm.yellowCardsMax}
                  onChange={(e) => setPredConfigForm((f) => ({ ...f, yellowCardsMax: e.target.value }))}
                  className={INPUT + " w-24"}
                />
                <span className="text-slate-500 text-xs">kaarten</span>
              </div>
            </div>

            {/* Vraag 4: Totaal doelpunten */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">Totaal doelpunten VV Rietmolen</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Incl. eigen goals tegenstanders en spelers buiten selectie
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-xs text-slate-500">Punten:</label>
                  <input
                    type="number"
                    min="0"
                    value={predConfigForm.totalGoalsPoints}
                    onChange={(e) => setPredConfigForm((f) => ({ ...f, totalGoalsPoints: e.target.value }))}
                    className="w-16 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={predConfigForm.totalGoalsMin}
                  onChange={(e) => setPredConfigForm((f) => ({ ...f, totalGoalsMin: e.target.value }))}
                  className={INPUT + " w-24"}
                />
                <span className="text-slate-500 text-sm">t/m</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={predConfigForm.totalGoalsMax}
                  onChange={(e) => setPredConfigForm((f) => ({ ...f, totalGoalsMax: e.target.value }))}
                  className={INPUT + " w-24"}
                />
                <span className="text-slate-500 text-xs">doelpunten</span>
              </div>
            </div>

            {/* Toggle zichtbaarheid */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={predConfigForm.showPointsToParticipants}
                  onChange={(e) =>
                    setPredConfigForm((f) => ({ ...f, showPointsToParticipants: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </div>
              <div>
                <span className="text-sm font-medium text-slate-300">Punten tonen aan deelnemers</span>
                <p className="text-xs text-slate-600">
                  Deelnemers zien hoeveel punten elke voorspelling waard is bij het invulscherm
                </p>
              </div>
            </label>

            {predConfigMsg && (
              <p
                className={`text-sm px-3 py-2 rounded-lg border ${
                  predConfigMsg.type === "ok"
                    ? "bg-green-900/20 text-green-400 border-green-500/30"
                    : "bg-red-900/20 text-red-400 border-red-500/30"
                }`}
              >
                {predConfigMsg.text}
              </p>
            )}

            {predConfig?.processed && (
              <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded-lg px-3 py-2">
                Bonuspunten zijn al verwerkt — trek eerst in voordat je de instellingen wijzigt.
              </p>
            )}
            <div className="flex gap-3 flex-wrap items-center border-t border-slate-800 pt-5">
              <button
                onClick={savePredConfig}
                disabled={predConfigSaving || predConfig?.processed}
                className={BTN_PRIMARY}
              >
                {predConfigSaving ? "Opslaan..." : "Instellingen opslaan"}
              </button>
              <div className="flex-1" />
              {!predConfig?.processed ? (
                <button
                  onClick={openPredPreview}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors border border-emerald-500/30"
                >
                  Bonuspunten verwerken...
                </button>
              ) : (
                <button
                  onClick={retractBonusPoints}
                  disabled={predProcessing}
                  className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg font-semibold text-sm transition-colors border border-red-500/30 disabled:opacity-50"
                >
                  {predProcessing ? "Bezig..." : "Bonuspunten intrekken"}
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* Modal: Bonuspunten bevestiging */}
      {showPredPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">Bonuspunten verwerken</h3>
                <p className="text-sm text-slate-500 mt-0.5">Controleer het overzicht en bevestig</p>
              </div>
              <button
                onClick={() => setShowPredPreview(false)}
                className="text-slate-500 hover:text-slate-300 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {loadingPredPreview ? (
              <p className="text-slate-500 text-sm py-8 text-center">Berekenen...</p>
            ) : predPreview ? (
              <>
                <p className="text-xs text-slate-500 mb-3">
                  <span className="font-semibold text-white">{predPreview.total}</span> deelnemers hebben
                  voorspellingen ingediend
                </p>
                <div className="space-y-3 mb-5">
                  {[
                    {
                      label: "Topscorer",
                      answer: predPreview.config.topScorer?.name ?? (
                        <span className="text-slate-600 italic">Niet ingesteld</span>
                      ),
                      points: predPreview.config.topScorerPoints,
                      count: predPreview.topScorerCount,
                    },
                    {
                      label: "Assistkoning",
                      answer: predPreview.config.assistKoning?.name ?? (
                        <span className="text-slate-600 italic">Niet ingesteld</span>
                      ),
                      points: predPreview.config.assistKoningPoints,
                      count: predPreview.assistKoningCount,
                    },
                    {
                      label: "Gele kaarten",
                      answer:
                        predPreview.config.yellowCardsMin != null &&
                        predPreview.config.yellowCardsMax != null ? (
                          `${predPreview.config.yellowCardsMin} – ${predPreview.config.yellowCardsMax}`
                        ) : (
                          <span className="text-slate-600 italic">Niet ingesteld</span>
                        ),
                      points: predPreview.config.yellowCardsPoints,
                      count: predPreview.yellowCardsCount,
                    },
                    {
                      label: "Totaal doelpunten",
                      answer:
                        predPreview.config.totalGoalsMin != null &&
                        predPreview.config.totalGoalsMax != null ? (
                          `${predPreview.config.totalGoalsMin} – ${predPreview.config.totalGoalsMax}`
                        ) : (
                          <span className="text-slate-600 italic">Niet ingesteld</span>
                        ),
                      points: predPreview.config.totalGoalsPoints,
                      count: predPreview.totalGoalsCount,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/50 gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                          {row.label}
                        </p>
                        <p className="text-sm text-white font-medium mt-0.5 truncate">{row.answer}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-cyan-400 font-bold text-sm">{row.points} pt</p>
                        {row.count !== null && (
                          <p className="text-slate-500 text-xs mt-0.5">
                            {row.count} {row.count === 1 ? "deelnemer" : "deelnemers"} goed
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowPredPreview(false)} className={BTN_SECONDARY}>
                    Annuleer
                  </button>
                  <button
                    onClick={processBonusPoints}
                    disabled={predProcessing}
                    className="flex-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {predProcessing ? "Verwerken..." : "Bevestig en verwerk"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-red-400 text-sm">Kon preview niet laden.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
