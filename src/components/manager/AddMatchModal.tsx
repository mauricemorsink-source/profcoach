"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import type { PlayerPerf, AllPlayer } from "./types";
import { TEAM_LABEL, CLUB_LABEL, POSITION_LABEL, POSITION_COLOR, INPUT, LABEL, NUM_INPUT } from "./constants";
import { toCardValue, fromCardValue } from "./helpers";
import GuestPicker from "./GuestPicker";

type AddForm = {
  submittedByName: string;
  name: string;
  homeAway: string;
  matchDate: string;
  goalsScored: string;
  goalsConceded: string;
  notes: string;
};

export default function AddMatchModal({
  modalStep,
  setModalStep,
  addForm,
  setAddForm,
  extraScorers,
  setExtraScorers,
  addError,
  setAddError,
  addLoading,
  addPerfs,
  onUpdateAddPerf,
  loadingPlayers,
  allPlayers,
  showGuestPickerAdd,
  guestSearchAdd,
  onGuestSearchChange,
  onAddGuest,
  onCloseGuestPicker,
  onShowGuestPicker,
  onRemoveGuest,
  managedTeam,
  addPerfsBoxRef,
  onClose,
  onSubmit,
}: {
  modalStep: 1 | 2 | 3;
  setModalStep: Dispatch<SetStateAction<1 | 2 | 3>>;
  addForm: AddForm;
  setAddForm: Dispatch<SetStateAction<AddForm>>;
  extraScorers: { goals: string; description: string }[];
  setExtraScorers: Dispatch<SetStateAction<{ goals: string; description: string }[]>>;
  addError: string;
  setAddError: Dispatch<SetStateAction<string>>;
  addLoading: boolean;
  addPerfs: PlayerPerf[];
  onUpdateAddPerf: (playerId: string, field: keyof PlayerPerf, value: unknown) => void;
  loadingPlayers: boolean;
  allPlayers: AllPlayer[];
  showGuestPickerAdd: boolean;
  guestSearchAdd: string;
  onGuestSearchChange: (v: string) => void;
  onAddGuest: (player: AllPlayer) => void;
  onCloseGuestPicker: () => void;
  onShowGuestPicker: () => void;
  onRemoveGuest: (playerId: string) => void;
  managedTeam: string;
  addPerfsBoxRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-700/50">
          <div>
            <h3 className="text-lg font-bold text-white">Wedstrijd toevoegen</h3>
            <div className="flex gap-2 mt-2">
              {[{ n: 1, label: "Details" }, { n: 2, label: "Spelers" }, { n: 3, label: "Overzicht" }].map(({ n, label }) => (
                <div key={n} className={`flex items-center gap-1.5 text-xs ${modalStep >= n ? "text-cyan-400" : "text-slate-600"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border ${modalStep > n ? "bg-cyan-500 border-cyan-500 text-white" : modalStep === n ? "border-cyan-500 text-cyan-400" : "border-slate-600 text-slate-600"}`}>
                    {modalStep > n ? "✓" : n}
                  </span>
                  {label}
                  {n < 3 && <span className="text-slate-700 ml-1">›</span>}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-lg">✕</button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto overflow-x-auto overscroll-contain px-6 py-5">

          {/* Step 1: Match details */}
          {modalStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Wie dient deze wedstrijd in?</label>
                <input
                  type="text"
                  value={addForm.submittedByName}
                  onChange={(e) => setAddForm({ ...addForm, submittedByName: e.target.value })}
                  className={INPUT}
                  placeholder="Voor- en achternaam"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Bij vragen over het verloop van de wedstrijd kan de organisatie hierover contact opnemen.
                </p>
              </div>
              <div>
                <label className={LABEL}>Tegenstander</label>
                <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className={INPUT} placeholder="Naam tegenstander" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className={LABEL}>Thuis / Uit</label>
                  <select value={addForm.homeAway} onChange={(e) => setAddForm({ ...addForm, homeAway: e.target.value })} className={INPUT}>
                    <option value="HOME">Thuis</option>
                    <option value="AWAY">Uit</option>
                    <option value="NEUTRAL">Neutraal</option>
                  </select>
                </div>
                <div className="min-w-0">
                  <label className={LABEL}>Datum & tijd</label>
                  <div className="w-full overflow-hidden rounded-lg">
                    <input
                      type="date"
                      value={addForm.matchDate}
                      onChange={(e) => setAddForm({ ...addForm, matchDate: e.target.value })}
                      className={INPUT + " min-w-0"}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>
              {/* Score — visual home/away display */}
              <div>
                <label className={LABEL}>Stand</label>
                <div className="flex items-center gap-3">
                  {/* Left side (home team) */}
                  <div className="flex-1 min-w-0 text-center">
                    <p className="text-xs text-slate-500 truncate mb-1">
                      {addForm.homeAway === "AWAY"
                        ? (addForm.name || "Tegenstander")
                        : (TEAM_LABEL[managedTeam] ?? managedTeam)}
                    </p>
                    <input
                      type="number" min="0"
                      value={addForm.homeAway === "AWAY" ? addForm.goalsConceded : addForm.goalsScored}
                      onChange={(e) => setAddForm(
                        addForm.homeAway === "AWAY"
                          ? { ...addForm, goalsConceded: e.target.value }
                          : { ...addForm, goalsScored: e.target.value }
                      )}
                      onFocus={(e) => e.target.select()}
                      className="w-full text-center text-2xl font-bold bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-slate-500 font-bold text-2xl shrink-0">–</span>
                  {/* Right side (away team) */}
                  <div className="flex-1 min-w-0 text-center">
                    <p className="text-xs text-slate-500 truncate mb-1">
                      {addForm.homeAway === "AWAY"
                        ? (TEAM_LABEL[managedTeam] ?? managedTeam)
                        : (addForm.name || "Tegenstander")}
                    </p>
                    <input
                      type="number" min="0"
                      value={addForm.homeAway === "AWAY" ? addForm.goalsScored : addForm.goalsConceded}
                      onChange={(e) => setAddForm(
                        addForm.homeAway === "AWAY"
                          ? { ...addForm, goalsScored: e.target.value }
                          : { ...addForm, goalsConceded: e.target.value }
                      )}
                      onFocus={(e) => e.target.select()}
                      className="w-full text-center text-2xl font-bold bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-700/50">
                In de volgende stappen kun je de spelersprestaties invullen en eventueel bijzonderheden over de wedstrijd toevoegen, zoals jubileums, eerste doelpunt in senioren of andere leuke weetjes.
              </p>
            </div>
          )}

          {/* Step 2: Player performances */}
          {modalStep === 2 && (

            <div>
              {loadingPlayers ? (
                <p className="text-slate-500 text-sm text-center py-8">Spelers laden...</p>
              ) : (
                <div>
                  <p className="text-slate-400 text-xs mb-3">Vink aan wie heeft meegespeeld en vul hun statistieken in.</p>
                  <div className="border border-slate-800 rounded-xl overflow-x-auto overscroll-x-contain">
                    <div ref={addPerfsBoxRef} className="overflow-y-auto overscroll-y-contain max-h-[45vh]">
                      <table className="w-full text-sm min-w-[540px]">
                        <thead className="sticky top-0 z-10 bg-slate-800">
                          <tr className="text-left text-slate-500 text-xs">
                            <th className="py-2 pl-3 pr-2 font-medium">Speler</th>
                            <th className="px-2 py-2 font-medium">Pos.</th>
                            <th className="px-2 py-2 font-medium text-center">Mee</th>
                            <th className="px-2 py-2 font-medium text-center">⚽</th>
                            <th className="px-2 py-2 font-medium text-center">Pen</th>
                            <th className="px-2 py-2 font-medium text-center">Ass</th>
                            <th className="px-2 py-2 font-medium text-center">EG</th>
                            <th className="px-2 py-2 font-medium text-center">Kaart</th>
                            <th className="px-2 py-2 w-6"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {addPerfs.map((p) => (
                            <tr key={p.playerId} className={`border-b border-slate-800 ${p.played ? "" : "opacity-40"}`}>
                              <td className="py-2 pl-3 pr-2 font-medium text-white text-xs whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  {p.playerName}
                                  {p.isGuest && (
                                    <span className="text-[9px] font-bold text-amber-400 bg-amber-900/30 border border-amber-500/30 px-1 py-0.5 rounded">GAST</span>
                                  )}
                                  {!p.isGuest && p.altTeam && (
                                    <span className="text-[9px] font-bold text-violet-400 bg-violet-900/30 border border-violet-500/30 px-1 py-0.5 rounded">FLEX</span>
                                  )}
                                </div>
                                {p.isGuest && p.clubTeam && (
                                  <div className="text-[10px] text-slate-500">{CLUB_LABEL[p.clubTeam] ?? p.clubTeam}</div>
                                )}
                                {!p.isGuest && p.altTeam && p.clubTeam && (
                                  <div className="text-[10px] text-slate-500">{CLUB_LABEL[p.clubTeam] ?? p.clubTeam}</div>
                                )}
                              </td>
                              <td className="px-2 py-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${POSITION_COLOR[p.position] ?? "text-slate-400"}`}>
                                  {POSITION_LABEL[p.position] ?? p.position}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center">
                                <input type="checkbox" checked={p.played} onChange={(e) => onUpdateAddPerf(p.playerId, "played", e.target.checked)} className="accent-cyan-500 w-4 h-4 cursor-pointer" />
                              </td>
                              <td className="px-2 py-2"><input type="number" min="0" value={p.goals} onChange={(e) => onUpdateAddPerf(p.playerId, "goals", Number(e.target.value))} onFocus={(e) => e.target.select()} disabled={!p.played} className={NUM_INPUT} /></td>
                              <td className="px-2 py-2"><input type="number" min="0" value={p.penaltyGoals} onChange={(e) => onUpdateAddPerf(p.playerId, "penaltyGoals", Number(e.target.value))} onFocus={(e) => e.target.select()} disabled={!p.played} className={NUM_INPUT} /></td>
                              <td className="px-2 py-2"><input type="number" min="0" value={p.assists} onChange={(e) => onUpdateAddPerf(p.playerId, "assists", Number(e.target.value))} onFocus={(e) => e.target.select()} disabled={!p.played} className={NUM_INPUT} /></td>
                              <td className="px-2 py-2"><input type="number" min="0" value={p.ownGoals} onChange={(e) => onUpdateAddPerf(p.playerId, "ownGoals", Number(e.target.value))} onFocus={(e) => e.target.select()} disabled={!p.played} className={NUM_INPUT} /></td>
                              <td className="px-2 py-2">
                                <select
                                  value={toCardValue(p.yellowCards, p.redCard)}
                                  onChange={(e) => { const c = fromCardValue(e.target.value); onUpdateAddPerf(p.playerId, "yellowCards", c.yellowCards); onUpdateAddPerf(p.playerId, "redCard", c.redCard); }}
                                  disabled={!p.played}
                                  className="bg-slate-800 border border-slate-700 text-white rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-30"
                                >
                                  <option value="">–</option>
                                  <option value="1y">🟡 1× geel</option>
                                  <option value="2y">🟡🟡 2× geel</option>
                                  <option value="r">🔴 Direct rood</option>
                                  <option value="1yr">🟡🔴 Geel + direct rood</option>
                                </select>
                              </td>
                              <td className="px-2 py-2 text-center">
                                {p.isGuest && (
                                  <button onClick={() => onRemoveGuest(p.playerId)} className="text-slate-600 hover:text-red-400 transition-colors text-sm">✕</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Gastspeler */}
                  <div className="mt-4">
                    {showGuestPickerAdd ? (
                      <GuestPicker
                        allPlayers={allPlayers}
                        managedTeam={managedTeam}
                        search={guestSearchAdd}
                        onSearchChange={onGuestSearchChange}
                        onAdd={onAddGuest}
                        onClose={onCloseGuestPicker}
                        existingIds={new Set(addPerfs.map((p) => p.playerId))}
                      />
                    ) : (
                      <button
                        onClick={onShowGuestPicker}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-500/30 rounded-lg transition-colors"
                      >
                        + Gastspeler toevoegen
                      </button>
                    )}
                  </div>

                  {/* Opmerkingen */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                      Opmerkingen
                    </label>
                    <p className="text-xs text-slate-600 mb-2">Eigen doelen, bijzonderheden, leuke weetjes of overige informatie over de wedstrijd</p>
                    <textarea
                      value={addForm.notes}
                      onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                      rows={3}
                      placeholder="Optioneel..."
                      className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
                    />
                  </div>

                </div>
              )}
            </div>
          )}

          {/* Step 3: Overzicht + validatie */}
          {modalStep === 3 && (() => {
            const totalPerfGoals = addPerfs.filter(p => p.played).reduce((s, p) => s + p.goals + p.penaltyGoals, 0);
            const totalExtraGoals = extraScorers.reduce((s, e) => s + (Number(e.goals) || 0), 0);
            const totalGoals = totalPerfGoals + totalExtraGoals;
            const expectedGoals = Number(addForm.goalsScored) || 0;
            const goalsMismatch = totalGoals !== expectedGoals;
            const goalsTooMany = totalGoals > expectedGoals;
            const totalAssists = addPerfs.filter(p => p.played).reduce((s, p) => s + p.assists, 0);
            const assistsMismatch = totalAssists > totalGoals;

            return (
              <div className="space-y-4">
                {/* Wedstrijd samenvatting */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs">Tegenstander</span>
                      <p className="text-white font-semibold">{addForm.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Datum</span>
                      <p className="text-white">{addForm.matchDate ? new Date(addForm.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : "–"}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Thuis / Uit</span>
                      <p className="text-white">{addForm.homeAway === "HOME" ? "Thuis" : addForm.homeAway === "AWAY" ? "Uit" : "Neutraal"}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Stand</span>
                      <p className="text-white font-mono text-sm">
                        {addForm.homeAway === "AWAY"
                          ? `${addForm.name || "Tegenstander"} ${addForm.goalsConceded || 0} – ${addForm.goalsScored || 0} ${TEAM_LABEL[managedTeam] ?? managedTeam}`
                          : `${TEAM_LABEL[managedTeam] ?? managedTeam} ${addForm.goalsScored || 0} – ${addForm.goalsConceded || 0} ${addForm.name || "Tegenstander"}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Speelden mee */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Speelden mee ({addPerfs.filter(p => p.played).length})</h4>
                  {addPerfs.filter(p => p.played).length === 0 ? (
                    <p className="text-slate-500 text-sm">Geen spelers geselecteerd.</p>
                  ) : (
                    <div className="space-y-1">
                      {addPerfs.filter(p => p.played).map((p) => (
                        <div key={p.playerId} className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-3 py-2">
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <span className="text-white text-sm font-medium truncate">{p.playerName}</span>
                            {p.isGuest && <span className="text-[9px] font-bold text-amber-400 bg-amber-900/30 border border-amber-500/30 px-1 py-0.5 rounded shrink-0">GAST</span>}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${POSITION_COLOR[p.position] ?? "text-slate-400"}`}>{POSITION_LABEL[p.position]}</span>
                          </div>
                          <div className="flex gap-2 text-xs shrink-0">
                            {p.goals > 0 && <span className="text-white">⚽ {p.goals}</span>}
                            {p.penaltyGoals > 0 && <span className="text-slate-300">Pen {p.penaltyGoals}</span>}
                            {p.assists > 0 && <span className="text-cyan-400">Ass {p.assists}</span>}
                            {p.ownGoals > 0 && <span className="text-red-400">EG {p.ownGoals}</span>}
                            {p.yellowCards === 1 && !p.redCard && <span className="text-amber-400">🟡</span>}
                            {p.yellowCards >= 2 && p.redCard && <span>🟡🟡 🔴</span>}
                            {p.yellowCards === 1 && p.redCard && <span>🟡 🔴</span>}
                            {p.redCard && p.yellowCards === 0 && <span className="text-red-500">🔴</span>}
                            {p.goals === 0 && p.assists === 0 && p.ownGoals === 0 && !p.yellowCards && !p.redCard && <span className="text-slate-600">–</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Validatie: goals mismatch — toon ook als er al scorers zijn toegevoegd */}
                {(goalsMismatch || extraScorers.length > 0) && (
                  <div className={`rounded-xl p-4 border ${goalsMismatch ? "bg-amber-900/20 border-amber-500/30" : "bg-slate-800/40 border-slate-700/50"}`}>
                    {goalsMismatch ? (
                      <>
                        <p className="text-amber-400 font-semibold text-sm mb-1">Doelpunten komen niet overeen</p>
                        <p className="text-amber-300/80 text-xs mb-3">
                          Geregistreerd: {totalGoals} · Eindstand: {expectedGoals} voor {TEAM_LABEL[managedTeam] ?? managedTeam}.
                          Pas de doelpuntenmakers in de vorige stap aan, of voeg hier spelers toe die niet in de selectie zitten
                          (denk aan nieuwe spelers, jeugdspelers of eigen goals van tegenstanders).
                        </p>
                      </>
                    ) : (
                      <p className="text-green-400 font-semibold text-sm mb-3">✓ Doelpunten kloppen ({totalGoals}/{expectedGoals})</p>
                    )}
                    <div className="space-y-2">
                      {extraScorers.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input type="number" min="0" value={s.goals}
                            onChange={(e) => setExtraScorers(prev => prev.map((x, j) => j === i ? { ...x, goals: e.target.value } : x))}
                            onFocus={(e) => e.target.select()}
                            className="w-14 bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50" />
                          <input type="text" value={s.description} placeholder="bijv. Eigen goal of Jan Jansen"
                            onChange={(e) => setExtraScorers(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                            className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50" />
                          <button onClick={() => setExtraScorers(prev => prev.filter((_, j) => j !== i))}
                            className="text-slate-500 hover:text-red-400 transition-colors text-lg leading-none px-1 shrink-0">✕</button>
                        </div>
                      ))}
                      <button
                        onClick={() => setExtraScorers(prev => [...prev, { goals: "1", description: "" }])}
                        className="mt-1 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
                      >
                        + Doelpuntenmaker toevoegen
                      </button>
                    </div>
                  </div>
                )}

                {/* Validatie: ingevulde doelpunten > werkelijke eindstand */}
                {goalsTooMany && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-2">
                    <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
                    <p className="text-red-300 text-xs">
                      Het aantal ingevulde doelpunten ({totalGoals}) is hoger dan het werkelijke aantal doelpunten van {TEAM_LABEL[managedTeam] ?? managedTeam} ({expectedGoals}). Controleer de statistieken.
                    </p>
                  </div>
                )}

                {/* Validatie: assists > goals */}
                {assistsMismatch && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-2">
                    <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
                    <p className="text-red-300 text-xs">
                      Het aantal assists ({totalAssists}) is hoger dan het aantal doelpunten ({totalGoals}). Controleer de statistieken.
                    </p>
                  </div>
                )}

                {/* Opmerkingen */}
                {addForm.notes.trim() && (
                  <div className="bg-slate-800/40 rounded-xl px-4 py-3">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide block mb-1">Opmerkingen</span>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{addForm.notes.trim()}</p>
                  </div>
                )}

                {addError && <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">{addError}</p>}
              </div>
            );
          })()}

          {addError && modalStep < 3 && (
            <p className="mt-4 text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">{addError}</p>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-700/50">
          <button
            onClick={() => modalStep === 1 ? onClose() : setModalStep((s) => (s - 1) as 1 | 2 | 3)}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {modalStep === 1 ? "Annuleer" : "← Terug"}
          </button>

          {modalStep < 3 ? (
            <button
              onClick={() => {
                if (modalStep === 1 && !addForm.submittedByName.trim()) { setAddError("Vul in wie deze wedstrijd indient."); return; }
                if (modalStep === 1 && !addForm.name.trim()) { setAddError("Naam tegenstander is verplicht."); return; }
                if (modalStep === 1 && !addForm.matchDate) { setAddError("Datum is verplicht."); return; }
                setAddError("");
                setModalStep((s) => (s + 1) as 2 | 3);
              }}
              className="px-5 py-2 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors neon-glow-sm"
            >
              Volgende →
            </button>
          ) : (() => {
            const totalPerfGoals = addPerfs.filter(p => p.played).reduce((s, p) => s + p.goals + p.penaltyGoals, 0);
            const totalExtraGoals = extraScorers.reduce((s, e) => s + (Number(e.goals) || 0), 0);
            const goalsMismatch = (totalPerfGoals + totalExtraGoals) !== (Number(addForm.goalsScored) || 0);
            return (
            <button
              onClick={onSubmit}
              disabled={addLoading || goalsMismatch}
              title={goalsMismatch ? "Herstel eerst het aantal doelpunten" : undefined}
              className="px-5 py-2 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors neon-glow-sm"
            >
              {addLoading ? "Opslaan..." : "Wedstrijd opslaan"}
            </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
