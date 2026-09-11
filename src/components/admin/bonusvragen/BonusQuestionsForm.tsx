import type { Player, PredConfig } from "./types";
import { TEAM_LABEL, INPUT, BTN_PRIMARY } from "./constants";

type PredConfigForm = {
  topScorerId: string;
  assistKoningId: string;
  yellowCardsMin: string;
  yellowCardsMax: string;
  totalGoalsMin: string;
  totalGoalsMax: string;
  topScorerPoints: string;
  assistKoningPoints: string;
  yellowCardsPoints: string;
  totalGoalsPoints: string;
  showPointsToParticipants: boolean;
};

type Props = {
  predConfig: PredConfig | null;
  loadingPredConfig: boolean;
  predConfigForm: PredConfigForm;
  setPredConfigForm: React.Dispatch<React.SetStateAction<PredConfigForm>>;
  players: Player[];
  predPlayerSearch: string;
  setPredPlayerSearch: React.Dispatch<React.SetStateAction<string>>;
  predActiveField: "topscorer" | "assistkoning" | null;
  setPredActiveField: React.Dispatch<React.SetStateAction<"topscorer" | "assistkoning" | null>>;
  predConfigMsg: { type: "ok" | "err"; text: string } | null;
  predConfigSaving: boolean;
  predProcessing: boolean;
  onSave: () => void;
  onOpenPreview: () => void;
  onRetract: () => void;
};

export default function BonusQuestionsForm({
  predConfig,
  loadingPredConfig,
  predConfigForm,
  setPredConfigForm,
  players,
  predPlayerSearch,
  setPredPlayerSearch,
  predActiveField,
  setPredActiveField,
  predConfigMsg,
  predConfigSaving,
  predProcessing,
  onSave,
  onOpenPreview,
  onRetract,
}: Props) {
  return (
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPredActiveField("topscorer");
                    setPredPlayerSearch("");
                  }}
                  className={`flex-1 text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    predConfigForm.topScorerId
                      ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                      : "border-slate-600 bg-slate-900/50 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {predConfigForm.topScorerId
                    ? players.find((p) => p.id === predConfigForm.topScorerId)?.name ?? "Gekozen"
                    : "Kies de topscorer..."}
                </button>
                {predConfigForm.topScorerId && (
                  <button
                    onClick={() => setPredConfigForm((f) => ({ ...f, topScorerId: "" }))}
                    title="Wis keuze"
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPredActiveField("assistkoning");
                    setPredPlayerSearch("");
                  }}
                  className={`flex-1 text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    predConfigForm.assistKoningId
                      ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                      : "border-slate-600 bg-slate-900/50 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {predConfigForm.assistKoningId
                    ? players.find((p) => p.id === predConfigForm.assistKoningId)?.name ?? "Gekozen"
                    : "Kies de assistkoning..."}
                </button>
                {predConfigForm.assistKoningId && (
                  <button
                    onClick={() => setPredConfigForm((f) => ({ ...f, assistKoningId: "" }))}
                    title="Wis keuze"
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Vraag 3: Gele kaarten */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-white">Totaal gele kaarten VV Rietmolen</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enkel gele kaarten voor spelers van VV Rietmolen. Gele kaarten van de tegenstander tellen niet mee.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
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
              {(predConfigForm.yellowCardsMin || predConfigForm.yellowCardsMax) && (
                <button
                  onClick={() => setPredConfigForm((f) => ({ ...f, yellowCardsMin: "", yellowCardsMax: "" }))}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors ml-auto"
                >
                  Wis
                </button>
              )}
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
              {(predConfigForm.totalGoalsMin || predConfigForm.totalGoalsMax) && (
                <button
                  onClick={() => setPredConfigForm((f) => ({ ...f, totalGoalsMin: "", totalGoalsMax: "" }))}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors ml-auto"
                >
                  Wis
                </button>
              )}
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
              onClick={onSave}
              disabled={predConfigSaving || predConfig?.processed}
              className={BTN_PRIMARY}
            >
              {predConfigSaving ? "Opslaan..." : "Instellingen opslaan"}
            </button>
            <div className="flex-1" />
            {!predConfig?.processed ? (
              <button
                onClick={onOpenPreview}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors border border-emerald-500/30"
              >
                Bonuspunten verwerken...
              </button>
            ) : (
              <button
                onClick={onRetract}
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
  );
}
