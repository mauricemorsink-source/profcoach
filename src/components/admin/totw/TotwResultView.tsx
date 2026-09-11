import type { TotWResult } from "./types";
import { TEAM_LABEL } from "./constants";
import { Pitch } from "./Pitch";

export function TotwResultView({
  totw,
  title,
  subtitle,
  onDownload,
}: {
  totw: TotWResult;
  title: string;
  subtitle: string;
  onDownload: () => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold">{title}</h2>
          {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
        </div>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium border border-slate-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Download PNG
        </button>
      </div>

      <Pitch totw={totw} title={title} subtitle={subtitle} />

      {/* Player overview */}
      <div className="bg-slate-900 neon-border rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Selectie</p>
        <div className="space-y-1.5">
          {totw.players.map((p) => (
            <div key={p.playerId} className="flex items-center gap-3 text-sm">
              <span className="text-slate-500 w-8 text-xs shrink-0">{p.position}</span>
              <span className="text-white font-medium flex-1">{p.name}</span>
              <span className="text-slate-400 text-xs">{TEAM_LABEL[p.clubTeam] ?? p.clubTeam}</span>
              <span className="text-cyan-400 font-bold w-14 text-right shrink-0">{p.points} pt</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
