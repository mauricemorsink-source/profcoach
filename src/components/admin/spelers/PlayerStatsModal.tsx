import { useState } from "react";
import type { Player, PlayerStats } from "./types";
import { POSITION_LABEL, TEAM_LABEL, BTN_PRIMARY, BTN_SECONDARY, BTN_DANGER } from "./constants";

const PICKED_BY_PREVIEW_COUNT = 10;

type Props = {
  playerStatsModal: Player;
  playerStats: PlayerStats | null;
  loadingPlayerStats: boolean;
  onClose: () => void;
  onEdit: (player: Player) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  deletingId: string | null;
  onDelete: (id: string) => void;
};

export default function PlayerStatsModal({
  playerStatsModal,
  playerStats,
  loadingPlayerStats,
  onClose,
  onEdit,
  confirmDeleteId,
  setConfirmDeleteId,
  deletingId,
  onDelete,
}: Props) {
  const [showAllPicks, setShowAllPicks] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">{playerStatsModal.name}</h3>
            <p className="text-sm text-slate-500">
              {POSITION_LABEL[playerStatsModal.position]} · {TEAM_LABEL[playerStatsModal.clubTeam]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none mt-0.5"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {loadingPlayerStats ? (
            <p className="text-slate-500 text-sm text-center py-8">Laden...</p>
          ) : !playerStats ? (
            <p className="text-slate-500 text-sm text-center py-8">Geen data beschikbaar.</p>
          ) : (
            <>
              {/* Seizoen totalen */}
              {playerStats.seasonStats && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Seizoen totaal
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                      { label: "Punten", value: playerStats.seasonStats.totalPoints, highlight: true },
                      { label: "Wedstrijden", value: playerStats.seasonStats.matchesPlayed },
                      { label: "Goals", value: playerStats.seasonStats.goals },
                      { label: "Assists", value: playerStats.seasonStats.assists },
                      { label: "Gewonnen", value: playerStats.seasonStats.wins },
                      { label: "Gelijkspel", value: playerStats.seasonStats.draws },
                      { label: "Gele kaarten", value: playerStats.seasonStats.yellowCards },
                      { label: "Rode kaarten", value: playerStats.seasonStats.redCards },
                      ...(["GK", "DEF"].includes(playerStatsModal.position)
                        ? [{ label: "Clean sheets", value: playerStats.seasonStats.cleanSheets }]
                        : []),
                    ].map((s) => (
                      <div
                        key={s.label}
                        className={`rounded-xl p-3 text-center border ${
                          s.highlight
                            ? "bg-cyan-900/20 border-cyan-500/30"
                            : "bg-slate-800/50 border-slate-700"
                        }`}
                      >
                        <p className={`text-lg font-bold ${s.highlight ? "text-cyan-400" : "text-white"}`}>
                          {s.value}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gekozen door */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Gekozen door ({playerStats.pickedBy.length})
                </p>
                {playerStats.pickedBy.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nog door niemand gekozen.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {(showAllPicks ? playerStats.pickedBy : playerStats.pickedBy.slice(0, PICKED_BY_PREVIEW_COUNT)).map((p) => (
                        <span
                          key={p.teamEntryId}
                          title={p.locked ? "Team ingediend" : "Team nog niet ingediend (concept)"}
                          className={`text-xs px-2 py-1 rounded-full border font-medium flex items-center gap-1 ${
                            p.locked
                              ? "bg-slate-800 border-slate-700 text-slate-300"
                              : "bg-amber-900/20 border-amber-500/30 text-amber-400"
                          }`}
                        >
                          {p.isCaptain && <span className="text-yellow-400 font-bold">C</span>}
                          {p.naam ?? <span className="italic text-slate-500">Geen naam</span>}
                          {!p.locked && <span className="text-[10px] opacity-70">(concept)</span>}
                        </span>
                      ))}
                    </div>
                    {playerStats.pickedBy.length > PICKED_BY_PREVIEW_COUNT && (
                      <button
                        onClick={() => setShowAllPicks((v) => !v)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors mt-2"
                      >
                        {showAllPicks ? "Toon minder" : `Toon meer (${playerStats.pickedBy.length - PICKED_BY_PREVIEW_COUNT})`}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Per wedstrijd */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Per verwerkte wedstrijd
                </p>
                {playerStats.performances.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nog geen verwerkte wedstrijden.</p>
                ) : (
                  <div className="space-y-2">
                    {playerStats.performances.map((p) => (
                      <div
                        key={p.matchId}
                        className={`rounded-xl border p-3 ${
                          !p.played || p.isExcluded ? "border-slate-800 opacity-50" : "border-slate-700 bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="font-medium text-white text-sm flex items-center gap-1.5 flex-wrap">
                              {TEAM_LABEL[p.clubTeam] ?? p.clubTeam} {p.homeAway === "HOME" ? "vs" : "@"}{" "}
                              {p.matchName}
                              {p.isExcluded && (
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-900/30 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                                  Uitgesloten (gastspeler)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(p.matchDate).toLocaleDateString("nl-NL", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                              {" · "}
                              {p.homeAway === "AWAY"
                                ? `${p.goalsConceded}–${p.goalsScored}`
                                : `${p.goalsScored}–${p.goalsConceded}`}
                              {" · "}
                              {p.played
                                ? p.won
                                  ? "Gewonnen"
                                  : p.drew
                                  ? "Gelijkspel"
                                  : "Verloren"
                                : "Niet gespeeld"}
                              {p.isExcluded && " · telt niet mee voor punten (speelde die ronde ook voor eigen elftal)"}
                            </p>
                          </div>
                          <span
                            className={`text-lg font-black shrink-0 ${
                              p.points > 0
                                ? "text-cyan-400"
                                : p.points < 0
                                ? "text-red-400"
                                : "text-slate-500"
                            }`}
                          >
                            {p.points > 0 ? "+" : ""}
                            {p.points}
                          </span>
                        </div>
                        {p.played && Object.keys(p.breakdown).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(p.breakdown).map(([label, pts]) => (
                              <span
                                key={label}
                                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                  pts > 0
                                    ? "bg-green-900/20 border-green-500/20 text-green-400"
                                    : "bg-red-900/20 border-red-500/20 text-red-400"
                                }`}
                              >
                                {label}: {pts > 0 ? "+" : ""}
                                {pts}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0 flex items-center gap-3">
          <button onClick={onClose} className={BTN_SECONDARY}>
            Sluiten
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(playerStatsModal);
            }}
            className={BTN_PRIMARY}
          >
            Bewerken
          </button>
          <div className="ml-auto">
            {confirmDeleteId === playerStatsModal.id ? (
              <span className="flex items-center gap-2">
                <span className="text-sm text-red-400">Zeker weten?</span>
                <button
                  onClick={() => {
                    onDelete(playerStatsModal.id);
                    onClose();
                  }}
                  disabled={deletingId === playerStatsModal.id}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  {deletingId === playerStatsModal.id ? "..." : "Ja"}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Nee
                </button>
              </span>
            ) : (
              <button onClick={() => setConfirmDeleteId(playerStatsModal.id)} className={BTN_DANGER}>
                Verwijderen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
