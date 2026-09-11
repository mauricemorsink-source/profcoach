import type { Dispatch, SetStateAction } from "react";
import type { FlexConflict } from "./types";
import { POSITION_LABEL, POSITION_COLOR, TEAM_LABEL, BTN_PRIMARY, BTN_SECONDARY } from "./constants";

type ConflictModalState = {
  momentId: string;
  conflicts: FlexConflict[];
  selections: Record<string, Set<string>>;
};

type Props = {
  conflictModal: ConflictModalState;
  setConflictModal: Dispatch<SetStateAction<ConflictModalState | null>>;
  confirmPublishWithConflicts: () => void;
};

export default function ConflictModal({
  conflictModal,
  setConflictModal,
  confirmPublishWithConflicts,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">Speler conflict</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Vink aan welke wedstrijd(en) mogen meetellen voor punten. Niet aangevinkte wedstrijden tellen niet mee.
            </p>
          </div>
          <button
            onClick={() => setConflictModal(null)}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {conflictModal.conflicts.map((conflict) => {
            const selected = conflictModal.selections[conflict.playerId];
            const noneSelected = selected.size === 0;
            return (
              <div key={conflict.playerId} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-white">{conflict.player.name}</span>
                  {conflict.player.altTeam && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-violet-900/50 text-violet-300 border border-violet-500/30 font-medium">
                      FLEX
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${POSITION_COLOR[conflict.player.position] ?? "text-slate-400"}`}>
                    {POSITION_LABEL[conflict.player.position] ?? conflict.player.position}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Oorspronkelijk elftal:{" "}
                  <span className="text-slate-300">
                    {TEAM_LABEL[conflict.player.clubTeam] ?? conflict.player.clubTeam}
                  </span>
                </p>
                <div className="space-y-2">
                  {conflict.matches.map((m) => {
                    const isChecked = selected.has(m.matchId);
                    return (
                      <label
                        key={m.matchId}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          isChecked
                            ? "border-cyan-500/50 bg-cyan-900/20"
                            : "border-slate-600 bg-slate-800 hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setConflictModal((prev) => {
                              if (!prev) return prev;
                              const next = new Set(prev.selections[conflict.playerId]);
                              if (next.has(m.matchId)) next.delete(m.matchId);
                              else next.add(m.matchId);
                              return {
                                ...prev,
                                selections: { ...prev.selections, [conflict.playerId]: next },
                              };
                            });
                          }}
                          className="mt-0.5 accent-cyan-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm text-white font-medium">{m.matchName}</span>
                            {m.isOriginalTeam && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-500/20 font-medium">
                                Oorspronkelijk
                              </span>
                            )}
                          </div>
                          <span className={`text-xs ${isChecked ? "text-slate-400" : "text-slate-600"}`}>
                            {TEAM_LABEL[m.matchClubTeam] ?? m.matchClubTeam}
                            {" · "}
                            {new Date(m.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <div className={`flex items-center gap-2 mt-1 text-xs ${isChecked ? "text-slate-300" : "text-slate-600"}`}>
                            {m.goals > 0 && <span>{m.goals} ⚽</span>}
                            {m.assists > 0 && <span>{m.assists} 🅰</span>}
                            {m.yellowCards === 1 && !m.redCard && <span>🟡</span>}
                            {m.yellowCards === 1 && m.redCard && <span>🟡🔴</span>}
                            {m.yellowCards >= 2 && m.redCard && <span>🟡🟡 🔴</span>}
                            {m.redCard && m.yellowCards === 0 && <span>🔴</span>}
                            {m.ownGoals > 0 && <span>{m.ownGoals} ED</span>}
                            {m.goals === 0 && m.assists === 0 && m.yellowCards === 0 && !m.redCard && m.ownGoals === 0 && (
                              <span>Gespeeld</span>
                            )}
                            <span className={`ml-auto font-semibold ${isChecked ? "text-cyan-400" : "text-slate-600 line-through"}`}>
                              {m.points > 0 ? "+" : ""}{m.points} ptn
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {noneSelected && (
                  <p className="text-xs text-amber-400 mt-2">
                    Selecteer minimaal één wedstrijd om te verwerken, of deselecteer alles om de speler
                    over te slaan.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
          <button onClick={() => setConflictModal(null)} className={BTN_SECONDARY}>
            Annuleer
          </button>
          <button onClick={confirmPublishWithConflicts} className={BTN_PRIMARY}>
            Publiceer
          </button>
        </div>
      </div>
    </div>
  );
}
