"use client";

import type { RefObject, ReactNode } from "react";
import type { MatchDetail, PlayerPerf, AllPlayer } from "./types";
import { TEAM_LABEL, STATUS_LABEL, STATUS_STYLE, NUM_INPUT } from "./constants";
import PerfRow from "./PerfRow";
import GuestPicker from "./GuestPicker";

export default function PerformancesView({
  loadingDetail,
  matchDetail,
  managedTeam,
  perfsBoxRef,
  perfTableHeader,
  perfs,
  onUpdatePerf,
  onRemoveGuest,
  allPlayers,
  showGuestPickerPerf,
  guestSearchPerf,
  onGuestSearchChange,
  onAddGuest,
  onCloseGuestPicker,
  onShowGuestPicker,
  onSavePerformances,
  saving,
  saveMsg,
}: {
  loadingDetail: boolean;
  matchDetail: MatchDetail | null;
  managedTeam: string;
  perfsBoxRef: RefObject<HTMLDivElement | null>;
  perfTableHeader: ReactNode;
  perfs: PlayerPerf[];
  onUpdatePerf: (playerId: string, field: keyof PlayerPerf, value: unknown) => void;
  onRemoveGuest: (playerId: string) => void;
  allPlayers: AllPlayer[];
  showGuestPickerPerf: boolean;
  guestSearchPerf: string;
  onGuestSearchChange: (v: string) => void;
  onAddGuest: (player: AllPlayer) => void;
  onCloseGuestPicker: () => void;
  onShowGuestPicker: () => void;
  onSavePerformances: () => void;
  saving: boolean;
  saveMsg: string | null;
}) {
  return (
    <div>
      {loadingDetail ? (
        <p className="text-slate-500 text-sm">Laden...</p>
      ) : matchDetail ? (
        <div>
          <div className="bg-slate-900 neon-border rounded-xl p-4 mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white">{matchDetail.match.name}</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {new Date(matchDetail.match.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                {" · "}
                <span className="font-mono text-white">
                  {matchDetail.match.homeAway === "AWAY"
                    ? `${matchDetail.match.name} ${matchDetail.match.goalsConceded} – ${matchDetail.match.goalsScored} ${TEAM_LABEL[managedTeam] ?? managedTeam}`
                    : `${TEAM_LABEL[managedTeam] ?? managedTeam} ${matchDetail.match.goalsScored} – ${matchDetail.match.goalsConceded} ${matchDetail.match.name}`}
                </span>
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[matchDetail.match.status]}`}>
              {STATUS_LABEL[matchDetail.match.status]}
            </span>
          </div>

          <div className="relative">
            <div className="bg-slate-900 neon-border rounded-xl overflow-x-auto overscroll-x-contain">
              <div ref={perfsBoxRef} className="overflow-y-auto overscroll-y-contain max-h-[60vh]">
                <table className="w-full text-sm min-w-[540px]">
                  <thead className="sticky top-0 z-10 bg-slate-800">{perfTableHeader}</thead>
                  <tbody>
                    {perfs.map((p) => (
                      <PerfRow
                        key={p.playerId}
                        p={p}
                        locked={matchDetail.match.status === "PROCESSED"}
                        onChange={(field, value) => onUpdatePerf(p.playerId, field, value)}
                        onRemove={p.isGuest ? () => onRemoveGuest(p.playerId) : undefined}
                        numInputClass={NUM_INPUT}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-slate-900 to-transparent rounded-r-xl sm:hidden" />
          </div>

          {(matchDetail.match.status === "PENDING" || matchDetail.match.status === "APPROVED" || matchDetail.match.status === "REJECTED") && (
            <div className="mt-3">
              {showGuestPickerPerf ? (
                <GuestPicker
                  allPlayers={allPlayers}
                  managedTeam={managedTeam}
                  search={guestSearchPerf}
                  onSearchChange={onGuestSearchChange}
                  onAdd={onAddGuest}
                  onClose={onCloseGuestPicker}
                  existingIds={new Set(perfs.map((p) => p.playerId))}
                />
              ) : (
                <button
                  onClick={onShowGuestPicker}
                  className="mt-2 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-500/30 rounded-lg transition-colors"
                >
                  + Gastspeler toevoegen
                </button>
              )}
            </div>
          )}

          {(matchDetail.match.status === "PENDING" || matchDetail.match.status === "APPROVED" || matchDetail.match.status === "REJECTED") && (
            <div className="mt-4">
              {matchDetail.match.status === "APPROVED" && (
                <p className="text-xs text-amber-400 mb-3">
                  Deze wedstrijd is al goedgekeurd. Opslaan zet hem terug naar &apos;Ingediend&apos; zodat de admin opnieuw kan fiatteren.
                </p>
              )}
              {matchDetail.match.status === "REJECTED" && (
                <p className="text-xs text-amber-400 mb-3">
                  Deze wedstrijd is afgekeurd. Pas de statistieken aan en sla op om opnieuw in te dienen.
                </p>
              )}
              <div className="flex items-center gap-4">
                <button
                  onClick={onSavePerformances}
                  disabled={saving}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors neon-glow-sm"
                >
                  {saving ? "Opslaan..." : "Prestaties opslaan"}
                </button>
                {saveMsg && (
                  <p className={`text-sm ${saveMsg === "Prestaties opgeslagen" ? "text-green-400" : "text-red-400"}`}>
                    {saveMsg}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-red-400 text-sm">Wedstrijd niet gevonden.</p>
      )}
    </div>
  );
}
