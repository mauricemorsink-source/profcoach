import type { ImportResult } from "./types";
import { BTN_PRIMARY } from "./constants";

type Props = {
  importFile: File | null;
  setImportFile: (f: File | null) => void;
  handleImport: () => void;
  importing: boolean;
  importResult: ImportResult | null;
};

export default function ImportPlayers({ importFile, setImportFile, handleImport, importing, importResult }: Props) {
  return (
    <section className="bg-slate-900 neon-border rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-1">Spelers importeren via Excel</h2>
      <p className="text-slate-500 text-sm mb-4">
        Upload een .xlsx bestand met kolommen: Naam, Positie (GK/DEF/MID/ATT), Team
        (ONE/TWO/THREE/FOUR/FIVE/DAMES), Waarde.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
          className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 file:transition-colors"
        />
        <button onClick={handleImport} disabled={!importFile || importing} className={BTN_PRIMARY}>
          {importing ? "Bezig..." : "Importeren"}
        </button>
      </div>
      {importResult && (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <p className="font-semibold text-slate-300 mb-2 text-sm">Resultaat</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-green-900/40 text-green-400 px-3 py-1 rounded-full text-xs border border-green-500/30">
              {importResult.imported} toegevoegd
            </span>
            {importResult.alreadyPresent > 0 && (
              <span className="bg-blue-900/40 text-blue-400 px-3 py-1 rounded-full text-xs border border-blue-500/30">
                {importResult.alreadyPresent} al aanwezig
              </span>
            )}
            {importResult.skipped > 0 && (
              <span className="bg-amber-900/40 text-amber-400 px-3 py-1 rounded-full text-xs border border-amber-500/30">
                {importResult.skipped} overgeslagen
              </span>
            )}
          </div>
          {importResult.errors.length > 0 && (
            <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30">
              <p className="font-semibold text-red-400 text-sm mb-1">Fouten:</p>
              <ul className="list-disc list-inside text-sm text-red-400/80 space-y-0.5">
                {importResult.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
