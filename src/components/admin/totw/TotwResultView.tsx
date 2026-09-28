import { useState } from "react";
import type { TotWPlayer, TotWResult } from "./types";
import { TEAM_LABEL } from "./constants";
import { Pitch } from "./Pitch";

export function TotwResultView({
  totw,
  title,
  subtitle,
  onDownload,
  onSwap,
}: {
  totw: TotWResult;
  title: string;
  subtitle: string;
  onDownload: () => void;
  onSwap: (oldPlayerId: string, newPlayer: TotWPlayer) => void;
}) {
  const [swapOpenFor, setSwapOpenFor] = useState<string | null>(null);
  const usedIds = new Set(totw.players.map((p) => p.playerId));

  // Live herberekend op basis van de huidige selectie (na eventuele handmatige wissels), niet
  // de vaste lijst van het moment van genereren — anders klopt de tekst niet meer zodra iemand
  // een speler handmatig wisselt.
  const tiedOut = totw.pool
    ? (() => {
        const minByPosition = new Map<string, number>();
        for (const p of totw.players) {
          const cur = minByPosition.get(p.position);
          if (cur === undefined || p.points < cur) minByPosition.set(p.position, p.points);
        }
        return totw.pool.filter(
          (c) => !usedIds.has(c.playerId) && minByPosition.get(c.position) === c.points
        );
      })()
    : totw.tiedOut ?? [];

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
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Selectie</p>
          {totw.pool && (
            <p className="text-xs text-slate-600">Niet akkoord met een keuze? Klik op &quot;Wissel&quot; om zelf iemand anders te kiezen.</p>
          )}
        </div>
        <div className="space-y-1.5">
          {totw.players.map((p) => {
            const candidates = (totw.pool ?? [])
              .filter((c) => c.position === p.position && (c.playerId === p.playerId || !usedIds.has(c.playerId)));
            return (
              <div key={p.playerId} className="text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 w-8 text-xs shrink-0">{p.position}</span>
                  <span className="text-white font-medium flex-1">{p.name}</span>
                  <span className="text-slate-400 text-xs">{TEAM_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                  <span className="text-cyan-400 font-bold w-14 text-right shrink-0">{p.points} pt</span>
                  {totw.pool && candidates.length > 1 && (
                    <button
                      onClick={() => setSwapOpenFor(swapOpenFor === p.playerId ? null : p.playerId)}
                      className="text-xs text-slate-500 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/40 rounded-lg px-2 py-1 shrink-0 transition-colors"
                    >
                      {swapOpenFor === p.playerId ? "Sluiten" : "Wissel"}
                    </button>
                  )}
                </div>
                {swapOpenFor === p.playerId && (
                  <div className="ml-11 mt-1.5 mb-1 bg-slate-800 border border-slate-700 rounded-lg p-2 max-h-48 overflow-y-auto space-y-0.5">
                    {candidates.map((c) => (
                      <button
                        key={c.playerId}
                        onClick={() => {
                          if (c.playerId !== p.playerId) onSwap(p.playerId, c);
                          setSwapOpenFor(null);
                        }}
                        className={`w-full flex items-center gap-2 text-left px-2 py-1 rounded text-xs transition-colors ${
                          c.playerId === p.playerId ? "bg-cyan-500/10 text-cyan-400" : "text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="text-slate-500">{TEAM_LABEL[c.clubTeam] ?? c.clubTeam}</span>
                        <span className="font-bold w-10 text-right shrink-0">{c.points} pt</span>
                        {c.playerId === p.playerId && <span className="shrink-0">huidig</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {tiedOut.length > 0 && (
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800">
            Evenveel punten als de laatst gekozen speler, maar niet meer in dit elftal:{" "}
            {tiedOut.map((p) => `${p.name} (${p.position}, ${p.points} pt)`).join(", ")}.
          </p>
        )}
      </div>
    </section>
  );
}
