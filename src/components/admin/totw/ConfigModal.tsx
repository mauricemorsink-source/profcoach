import type { Formation, FormationAdvice } from "./types";

export function ConfigModal({
  formations,
  advice,
  adviceLoading,
  recommendedCode,
  title,
  subtitle,
  selectedFormation,
  loading,
  error,
  onTitleChange,
  onSubtitleChange,
  onFormationChange,
  onConfirm,
  onClose,
}: {
  formations: Formation[];
  advice: FormationAdvice[] | null;
  adviceLoading: boolean;
  recommendedCode: string | null;
  title: string;
  subtitle: string;
  selectedFormation: Formation | null;
  loading: boolean;
  error: string | null;
  onTitleChange: (v: string) => void;
  onSubtitleChange: (v: string) => void;
  onFormationChange: (f: Formation) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
  const LABEL = "block text-sm font-medium text-slate-400 mb-1";

  const adviceByCode = new Map((advice ?? []).map((a) => [a.code, a]));
  const recommended = recommendedCode ? adviceByCode.get(recommendedCode) : undefined;
  const selectedAdvice = selectedFormation ? adviceByCode.get(selectedFormation.code) : undefined;
  const shape = (f: Formation) => `${f.defenders}-${f.midfielders}-${f.attackers}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div className="bg-slate-900 neon-border rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Configureer Team of the Week</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        <div>
          <label className={LABEL}>Titel</label>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Team of the Week"
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL}>Subtitel</label>
          <input
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="Speelronde 1"
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL}>Formatie</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {formations.map((f) => {
              const active = selectedFormation?.code === f.code;
              const a = adviceByCode.get(f.code);
              const isRecommended = f.code === recommendedCode;
              return (
                <button
                  key={f.code}
                  onClick={() => onFormationChange(f)}
                  className={`relative px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors text-center ${
                    active
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                      : "text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  {shape(f)}
                  {a && (
                    <span className={`block text-[10px] font-medium leading-tight ${a.complete ? "opacity-70" : "text-amber-400"}`}>
                      {a.complete ? `${a.total} pt` : "onvolledig"}
                    </span>
                  )}
                  {isRecommended && (
                    <span className="absolute -top-2 -right-1.5 text-[9px] font-bold uppercase tracking-wide bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded-full">
                      Advies
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500 mt-2.5 min-h-[2.25rem]">
            {adviceLoading ? (
              "Beste formatie berekenen..."
            ) : recommended && selectedFormation ? (
              <>
                Advies: <span className="text-amber-400 font-semibold">{shape(recommended)}</span> met samen{" "}
                <span className="text-white font-semibold">{recommended.total} pt</span>, de hoogste score van deze wedstrijden.
                {selectedAdvice && selectedAdvice.code !== recommended.code && (
                  <>
                    {" "}Jouw keuze {shape(selectedFormation)} levert{" "}
                    <span className="text-white font-semibold">{selectedAdvice.total} pt</span>
                    {" "}({selectedAdvice.total - recommended.total} pt).
                  </>
                )}
                {selectedAdvice && selectedAdvice.tiedOut > 0 && (
                  <> Bij {shape(selectedFormation)} vallen {selectedAdvice.tiedOut} speler{selectedAdvice.tiedOut !== 1 ? "s" : ""} met gelijke punten af.</>
                )}
              </>
            ) : (
              "Er zijn geen punten om een advies op te baseren; kies zelf een formatie."
            )}
          </p>
        </div>

        {error && (
          <p className="text-sm px-3 py-2 rounded-lg bg-red-900/20 text-red-400 border border-red-500/30">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onConfirm}
            disabled={loading || !selectedFormation}
            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors"
          >
            {loading ? "Laden..." : "Genereer elftal"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg text-sm font-medium transition-colors"
          >
            Annuleer
          </button>
        </div>
      </div>
    </div>
  );
}
