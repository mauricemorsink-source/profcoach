import type { AdminMatch, EditPerfEntry } from "./types";
import { POSITION_LABEL, POSITION_COLOR, STATUS_LABEL, STATUS_STYLE, TEAM_LABEL, INPUT, LABEL, SELECT, BTN_PRIMARY, BTN_SECONDARY } from "./constants";
import { toCardValue, fromCardValue, sortByLine } from "./helpers";
import { isGuestAppearance } from "@/lib/guest";

type EditMatchForm = {
  name: string;
  matchDate: string;
  thuisGoals: number;
  uitGoals: number;
  homeAway: string;
  notes: string;
};

type Props = {
  editingMatch: AdminMatch;
  editMatchReadOnly: boolean;
  closeEditMatch: () => void;
  editMatchForm: EditMatchForm;
  setEditMatchForm: (v: EditMatchForm) => void;
  editMatchError: string;
  editPerfsData: Record<string, EditPerfEntry>;
  updatePerfField: (playerId: string, field: string, value: boolean | number) => void;
  editMatchSaving: boolean;
  saveAll: () => void;
  approveFromModal: (status: "APPROVED" | "REJECTED") => void;
};

export default function EditMatchModal({
  editingMatch,
  editMatchReadOnly,
  closeEditMatch,
  editMatchForm,
  setEditMatchForm,
  editMatchError,
  editPerfsData,
  updatePerfField,
  editMatchSaving,
  saveAll,
  approveFromModal,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">
              {editMatchReadOnly ? "Prestaties bekijken" : "Wedstrijd bewerken"}
            </h3>
            <p className="text-sm text-slate-500">
              {TEAM_LABEL[editingMatch.clubTeam] ?? editingMatch.clubTeam}
              {editingMatch.submittedByName && (
                <> · ingediend door <span className="text-slate-300">{editingMatch.submittedByName}</span></>
              )}
            </p>
          </div>
          <button
            onClick={closeEditMatch}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Wedstrijd details: bewerkbaar of readonly */}
        {editMatchReadOnly ? (
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm">
              <span className="text-slate-500">Tegenstander: </span>
              <span className="text-white font-medium">{editingMatch.name}</span>
            </div>
            <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm">
              <span className="text-slate-500">Datum: </span>
              <span className="text-white">
                {new Date(editingMatch.matchDate).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm">
              <span className="text-slate-500">Uitslag: </span>
              <span className="text-white font-bold">
                {editingMatch.homeAway === "AWAY"
                  ? `${editingMatch.goalsConceded}–${editingMatch.goalsScored}`
                  : `${editingMatch.goalsScored}–${editingMatch.goalsConceded}`}
              </span>
            </div>
            <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm">
              <span className="text-slate-500">Status: </span>
              <span
                className={`font-medium ${
                  STATUS_STYLE[editingMatch.status].includes("orange")
                    ? "text-orange-400"
                    : STATUS_STYLE[editingMatch.status].includes("blue")
                    ? "text-blue-400"
                    : "text-slate-300"
                }`}
              >
                {STATUS_LABEL[editingMatch.status]}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div>
              <label className={LABEL}>Tegenstander</label>
              <input
                type="text"
                value={editMatchForm.name}
                onChange={(e) => setEditMatchForm({ ...editMatchForm, name: e.target.value })}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Datum & tijd</label>
              <input
                type="datetime-local"
                value={editMatchForm.matchDate}
                onChange={(e) => setEditMatchForm({ ...editMatchForm, matchDate: e.target.value })}
                className={INPUT}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Thuis/Uit</label>
                <select
                  value={editMatchForm.homeAway}
                  onChange={(e) => {
                    const newHA = e.target.value;
                    const shouldSwap =
                      (editMatchForm.homeAway === "HOME" && newHA === "AWAY") ||
                      (editMatchForm.homeAway === "AWAY" && newHA === "HOME");
                    setEditMatchForm({
                      ...editMatchForm,
                      homeAway: newHA,
                      ...(shouldSwap
                        ? { thuisGoals: editMatchForm.uitGoals, uitGoals: editMatchForm.thuisGoals }
                        : {}),
                    });
                  }}
                  className={SELECT}
                >
                  <option value="HOME">Thuis</option>
                  <option value="AWAY">Uit</option>
                  <option value="NEUTRAL">Neutraal</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Goals thuisploeg</label>
                <input
                  type="number"
                  value={editMatchForm.thuisGoals}
                  onChange={(e) =>
                    setEditMatchForm({ ...editMatchForm, thuisGoals: Number(e.target.value) })
                  }
                  onFocus={(e) => e.target.select()}
                  className={INPUT}
                  min="0"
                />
              </div>
              <div>
                <label className={LABEL}>Goals uitploeg</label>
                <input
                  type="number"
                  value={editMatchForm.uitGoals}
                  onChange={(e) =>
                    setEditMatchForm({ ...editMatchForm, uitGoals: Number(e.target.value) })
                  }
                  onFocus={(e) => e.target.select()}
                  className={INPUT}
                  min="0"
                />
              </div>
            </div>
            {editMatchError && (
              <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">
                {editMatchError}
              </p>
            )}
          </div>
        )}

        {/* Extra scorers + notes (read-only weergave) */}
        {(editingMatch.extraScorers?.length || editingMatch.notes) && (
          <div className="border-t border-slate-700 pt-5 space-y-3">
            {editingMatch.extraScorers && editingMatch.extraScorers.length > 0 && (
              <div>
                <label className={LABEL}>Doelpunten buiten selectie</label>
                <div className="space-y-1 mt-1">
                  {(editingMatch.extraScorers as { goals: number; description: string }[]).map(
                    (s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm bg-slate-800/50 rounded-lg px-3 py-1.5"
                      >
                        <span className="text-white font-semibold w-6 text-center">{s.goals}</span>
                        <span className="text-slate-400">{s.description}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
            {editingMatch.notes && (
              <div>
                <label className={LABEL}>Opmerkingen</label>
                <p className="text-slate-300 text-sm whitespace-pre-wrap mt-1 bg-slate-800/50 rounded-lg px-3 py-2">
                  {editingMatch.notes}
                </p>
              </div>
            )}
            {!editMatchReadOnly && (
              <div>
                <label className={LABEL}>Opmerkingen bewerken</label>
                <textarea
                  value={editMatchForm.notes}
                  onChange={(e) => setEditMatchForm({ ...editMatchForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Eigen doelen, bijzonderheden, weetjes..."
                  className={`${INPUT} resize-none`}
                />
              </div>
            )}
          </div>
        )}
        {!editMatchReadOnly && !editingMatch.notes && (
          <div className="border-t border-slate-700 pt-5">
            <label className={LABEL}>Opmerkingen</label>
            <textarea
              value={editMatchForm.notes}
              onChange={(e) => setEditMatchForm({ ...editMatchForm, notes: e.target.value })}
              rows={3}
              placeholder="Eigen doelen, bijzonderheden, weetjes..."
              className={`${INPUT} resize-none`}
            />
          </div>
        )}

        {/* Spelersbijdragen */}
        <div className="border-t border-slate-700 pt-5">
          <p className="text-sm font-semibold text-slate-400 mb-3">Spelersbijdragen</p>
          {editingMatch.performances.length === 0 ? (
            <p className="text-slate-500 text-sm mb-4">Nog geen prestaties ingevoerd.</p>
          ) : (
            <div className="relative">
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm min-w-[540px]">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-800">
                    <th className="pb-2 font-semibold">Speler</th>
                    <th className="pb-2 font-semibold text-center">Mee</th>
                    <th className="pb-2 font-semibold text-center">Goals</th>
                    <th className="pb-2 font-semibold text-center">Pen.</th>
                    <th className="pb-2 font-semibold text-center">Ass.</th>
                    <th className="pb-2 font-semibold text-center">E.G.</th>
                    <th className="pb-2 font-semibold text-center">Kaart</th>
                  </tr>
                </thead>
                <tbody>
                  {sortByLine(editingMatch.performances).map((p) => {
                    const ed = editPerfsData[p.playerId] ?? {
                      played: p.played,
                      goals: p.goals,
                      penaltyGoals: p.penaltyGoals,
                      assists: p.assists,
                      ownGoals: p.ownGoals,
                      yellowCards: p.yellowCards,
                      redCard: p.redCard,
                    };
                    return (
                      <tr
                        key={p.playerId}
                        className={`border-b border-slate-800/60 ${!ed.played ? "opacity-40" : ""}`}
                      >
                        <td className="py-1.5 font-medium text-white max-w-[160px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="truncate">{p.player.name}</span>
                            {isGuestAppearance(editingMatch.clubTeam, p.player) && (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-900/30 border border-amber-500/30 px-1 py-0.5 rounded shrink-0">GAST</span>
                            )}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${POSITION_COLOR[p.player.position] ?? "text-slate-400"}`}>
                              {POSITION_LABEL[p.player.position] ?? p.player.position}
                            </span>
                          </div>
                        </td>
                        <td className="py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={ed.played}
                            disabled={editMatchReadOnly}
                            onChange={(e) => updatePerfField(p.playerId, "played", e.target.checked)}
                            className="accent-cyan-500 disabled:opacity-60"
                          />
                        </td>
                        <td className="py-1.5 text-center">
                          <input
                            type="number"
                            value={ed.goals}
                            min={0}
                            readOnly={editMatchReadOnly}
                            onChange={(e) => updatePerfField(p.playerId, "goals", Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`}
                          />
                        </td>
                        <td className="py-1.5 text-center">
                          <input
                            type="number"
                            value={ed.penaltyGoals}
                            min={0}
                            readOnly={editMatchReadOnly}
                            onChange={(e) =>
                              updatePerfField(p.playerId, "penaltyGoals", Number(e.target.value))
                            }
                            onFocus={(e) => e.target.select()}
                            className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`}
                          />
                        </td>
                        <td className="py-1.5 text-center">
                          <input
                            type="number"
                            value={ed.assists}
                            min={0}
                            readOnly={editMatchReadOnly}
                            onChange={(e) =>
                              updatePerfField(p.playerId, "assists", Number(e.target.value))
                            }
                            onFocus={(e) => e.target.select()}
                            className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`}
                          />
                        </td>
                        <td className="py-1.5 text-center">
                          <input
                            type="number"
                            value={ed.ownGoals}
                            min={0}
                            readOnly={editMatchReadOnly}
                            onChange={(e) =>
                              updatePerfField(p.playerId, "ownGoals", Number(e.target.value))
                            }
                            onFocus={(e) => e.target.select()}
                            className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`}
                          />
                        </td>
                        <td className="py-1.5 text-center">
                          <select
                            value={toCardValue(ed.yellowCards, ed.redCard)}
                            disabled={editMatchReadOnly}
                            onChange={(e) => { const c = fromCardValue(e.target.value); updatePerfField(p.playerId, "yellowCards", c.yellowCards); updatePerfField(p.playerId, "redCard", c.redCard); }}
                            className={`text-white rounded px-1 py-0.5 text-xs focus:outline-none ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`}
                          >
                            <option value="">–</option>
                            <option value="1y">🟡 1× geel</option>
                            <option value="2y">🟡🟡 2× geel</option>
                            <option value="r">🔴 Direct rood</option>
                            <option value="1yr">🟡🔴 Geel + direct rood</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-slate-900 to-transparent sm:hidden" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 flex-wrap">
          {editMatchReadOnly ? (
            <button onClick={closeEditMatch} className={BTN_SECONDARY}>
              Sluiten
            </button>
          ) : (
            <>
              <button onClick={closeEditMatch} className={BTN_SECONDARY}>
                Annuleer
              </button>
              {(editingMatch.status === "PENDING" || editingMatch.status === "REJECTED") && (
                <button
                  onClick={() => approveFromModal("APPROVED")}
                  disabled={editMatchSaving}
                  className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors"
                >
                  {editMatchSaving ? "Bezig..." : "Goedkeuren"}
                </button>
              )}
              <button onClick={saveAll} disabled={editMatchSaving} className={BTN_PRIMARY}>
                {editMatchSaving ? "Opslaan..." : "Opslaan"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
