import type { PredPreview } from "./types";
import { BTN_SECONDARY } from "./constants";

type Props = {
  loadingPredPreview: boolean;
  predPreview: PredPreview | null;
  predProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ProcessPreviewModal({
  loadingPredPreview,
  predPreview,
  predProcessing,
  onClose,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">Bonuspunten verwerken</h3>
            <p className="text-sm text-slate-500 mt-0.5">Controleer het overzicht en bevestig</p>
          </div>
          <button
            onClick={onClose}
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
              <button onClick={onClose} className={BTN_SECONDARY}>
                Annuleer
              </button>
              <button
                onClick={onConfirm}
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
  );
}
