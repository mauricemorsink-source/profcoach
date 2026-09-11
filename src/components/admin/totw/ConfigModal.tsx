import type { Formation } from "./types";

export function ConfigModal({
  formations,
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
              const label = `${f.defenders}-${f.midfielders}-${f.attackers}`;
              const active = selectedFormation?.code === f.code;
              return (
                <button
                  key={f.code}
                  onClick={() => onFormationChange(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                    active
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                      : "text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
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
