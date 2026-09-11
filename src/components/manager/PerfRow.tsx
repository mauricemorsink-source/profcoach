"use client";

import type { PlayerPerf } from "./types";
import { CLUB_LABEL, POSITION_LABEL, POSITION_COLOR } from "./constants";
import { toCardValue, fromCardValue } from "./helpers";

// Sub-component: single performance row
export default function PerfRow({
  p,
  locked,
  onChange,
  onRemove,
  numInputClass,
}: {
  p: PlayerPerf;
  locked: boolean;
  onChange: (field: keyof PlayerPerf, value: unknown) => void;
  onRemove?: () => void;
  numInputClass: string;
}) {
  return (
    <tr className={`border-b border-slate-800 transition-colors ${p.played ? "bg-slate-800/20" : "opacity-40"}`}>
      <td className="px-4 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{p.playerName}</span>
          {p.isGuest && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-900/30 border border-amber-500/30 px-1.5 py-0.5 rounded">
              GAST
            </span>
          )}
          {p.isGuest && p.clubTeam && (
            <span className="text-xs text-slate-500">{CLUB_LABEL[p.clubTeam] ?? p.clubTeam}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${POSITION_COLOR[p.position] ?? "text-slate-400"}`}>
          {POSITION_LABEL[p.position] ?? p.position}
        </span>
      </td>
      <td className="px-3 py-2.5 text-center">
        <input
          type="checkbox"
          checked={p.played}
          onChange={(e) => onChange("played", e.target.checked)}
          disabled={locked}
          className="accent-cyan-500 w-4 h-4 cursor-pointer"
        />
      </td>
      <td className="px-3 py-2.5"><input type="number" min="0" value={p.goals} onChange={(e) => onChange("goals", Number(e.target.value))} onFocus={(e) => e.target.select()} disabled={!p.played || locked} className={numInputClass} /></td>
      <td className="px-3 py-2.5"><input type="number" min="0" value={p.penaltyGoals} onChange={(e) => onChange("penaltyGoals", Number(e.target.value))} onFocus={(e) => e.target.select()} disabled={!p.played || locked} className={numInputClass} /></td>
      <td className="px-3 py-2.5"><input type="number" min="0" value={p.assists} onChange={(e) => onChange("assists", Number(e.target.value))} onFocus={(e) => e.target.select()} disabled={!p.played || locked} className={numInputClass} /></td>
      <td className="px-3 py-2.5"><input type="number" min="0" value={p.ownGoals} onChange={(e) => onChange("ownGoals", Number(e.target.value))} onFocus={(e) => e.target.select()} disabled={!p.played || locked} className={numInputClass} /></td>
      <td className="px-3 py-2.5">
        <select
          value={toCardValue(p.yellowCards, p.redCard)}
          onChange={(e) => { const c = fromCardValue(e.target.value); onChange("yellowCards", c.yellowCards); onChange("redCard", c.redCard); }}
          disabled={!p.played || locked}
          className="bg-slate-800 border border-slate-700 text-white rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <option value="">–</option>
          <option value="1y">🟡 1× geel</option>
          <option value="2y">🟡🟡 2× geel</option>
          <option value="r">🔴 Direct rood</option>
          <option value="1yr">🟡🔴 Geel + direct rood</option>
        </select>
      </td>
      <td className="px-3 py-2.5 text-center">
        {p.isGuest && onRemove && !locked && (
          <button onClick={onRemove} className="text-slate-600 hover:text-red-400 transition-colors text-sm" title="Gastspeler verwijderen">✕</button>
        )}
      </td>
    </tr>
  );
}
