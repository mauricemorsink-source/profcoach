import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { AdminMatch, PublishMoment } from "./types";
import { TEAMS, TEAM_LABEL, STATUS_LABEL, STATUS_STYLE, BTN_PRIMARY, BTN_SECONDARY, BTN_SMALL, BTN_DANGER } from "./constants";
import { getOpponent } from "./helpers";
import MatchActionsMenu from "./MatchActionsMenu";

export type MenuPos = { top: number; right: number; anchorTop: number };

// Vaste (portal-)positie onder de knop. Past het menu daar niet meer in beeld, dan klapt het
// omhoog; past het ook daar niet, dan wordt het tegen de onderrand van het scherm geplaatst.
function FloatingMenu({ pos, children }: { pos: MenuPos; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = el.offsetHeight;
    const limit = window.innerHeight - 8;
    let top = pos.top;
    if (top + h > limit) {
      const above = pos.anchorTop - 4 - h;
      top = above >= 8 ? above : Math.max(8, limit - h);
    }
    el.style.top = `${top}px`;
  }, [pos]);
  return (
    <div
      ref={ref}
      style={{ position: "fixed", top: pos.top, right: pos.right }}
      className="z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl min-w-[220px] overflow-hidden"
    >
      {children}
    </div>
  );
}

type SortKey = "default" | "datum" | "status";
type SortDir = "asc" | "desc";
const MATCH_STATUS_ORDER: Record<string, number> = { APPROVED: 0, PENDING: 1, REJECTED: 2, PROCESSED: 3 };

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-slate-700 ml-1">↕</span>;
  return <span className="text-cyan-400 ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

type Props = {
  adminMatches: AdminMatch[];
  filteredMatches: AdminMatch[];
  loadingMatches: boolean;
  bulkDeleteMode: boolean;
  toggleBulkDeleteMode: () => void;
  loadAdminMatches: () => void;
  loadPublishMoments: () => void;
  selectAllPending: () => void;
  selectAllApproved: () => void;
  matchFilterTeam: string;
  setMatchFilterTeam: (v: string) => void;
  matchFilterStatus: string;
  setMatchFilterStatus: (v: string) => void;
  isProcessingStuck: boolean;
  resetProcessingLock: () => void;
  resettingProcessing: boolean;
  pointsMsg: { type: "ok" | "err"; text: string } | null;
  setPointsMsg: (v: { type: "ok" | "err"; text: string } | null) => void;
  approveSelectedIds: Set<string>;
  setApproveSelectedIds: (v: Set<string>) => void;
  bulkApproveMatches: (status: "APPROVED" | "REJECTED") => void;
  bulkApproving: boolean;
  bulkApproveError: string;
  processSelectedIds: Set<string>;
  setProcessSelectedIds: (v: Set<string>) => void;
  processPoints: () => void;
  processing: boolean;
  checkingGuests: boolean;
  deleteSelectedIds: Set<string>;
  setDeleteSelectedIds: (v: Set<string>) => void;
  confirmBulkDelete: boolean;
  setConfirmBulkDelete: (v: boolean) => void;
  bulkDeleteMatches: () => void;
  bulkDeleting: boolean;
  bulkDeleteError: string;
  toggleDeleteSelect: (id: string) => void;
  toggleProcessSelect: (id: string) => void;
  toggleApproveSelect: (id: string) => void;
  toggleAllDeleteSelect: () => void;
  toggleAllProcessSelect: () => void;
  toggleAllApproveSelect: () => void;
  matchMenuId: string | null;
  setMatchMenuId: (id: string | null) => void;
  desktopMenuPos: MenuPos | null;
  setDesktopMenuPos: (v: MenuPos | null) => void;
  openEditMatch: (m: AdminMatch) => void;
  approveMatch: (id: string, status: "APPROVED" | "REJECTED") => void;
  approvingId: string | null;
  assignToMoment: (matchId: string, momentId: string | null) => void;
  publishMoments: PublishMoment[];
  revertMatch: (id: string) => void;
  revertingMatchId: string | null;
  deleteMatch: (id: string) => void;
  deletingMatchId: string | null;
};

export default function MatchesList({
  adminMatches,
  filteredMatches,
  loadingMatches,
  bulkDeleteMode,
  toggleBulkDeleteMode,
  loadAdminMatches,
  loadPublishMoments,
  selectAllPending,
  selectAllApproved,
  matchFilterTeam,
  setMatchFilterTeam,
  matchFilterStatus,
  setMatchFilterStatus,
  isProcessingStuck,
  resetProcessingLock,
  resettingProcessing,
  pointsMsg,
  setPointsMsg,
  approveSelectedIds,
  setApproveSelectedIds,
  bulkApproveMatches,
  bulkApproving,
  bulkApproveError,
  processSelectedIds,
  setProcessSelectedIds,
  processPoints,
  processing,
  checkingGuests,
  deleteSelectedIds,
  setDeleteSelectedIds,
  confirmBulkDelete,
  setConfirmBulkDelete,
  bulkDeleteMatches,
  bulkDeleting,
  bulkDeleteError,
  toggleDeleteSelect,
  toggleProcessSelect,
  toggleApproveSelect,
  toggleAllDeleteSelect,
  toggleAllProcessSelect,
  toggleAllApproveSelect,
  matchMenuId,
  setMatchMenuId,
  desktopMenuPos,
  setDesktopMenuPos,
  openEditMatch,
  approveMatch,
  approvingId,
  assignToMoment,
  publishMoments,
  revertMatch,
  revertingMatchId,
  deleteMatch,
  deletingMatchId,
}: Props) {
  const pendingMoments = publishMoments.filter((p) => !p.publishedAt);
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: "datum" | "status") {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "datum" ? "desc" : "asc");
    }
  }

  // Presentatie-volgorde alleen: de select-all-checkboxes hierboven blijven op filteredMatches
  // (de gefilterde SET) werken, want die geven niets om weergavevolgorde.
  const sortedMatches = sortKey === "default" ? filteredMatches : [...filteredMatches].sort((a, b) => {
    const mult = sortDir === "asc" ? 1 : -1;
    if (sortKey === "datum") return mult * (new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
    return mult * ((MATCH_STATUS_ORDER[a.status] ?? 5) - (MATCH_STATUS_ORDER[b.status] ?? 5));
  });

  const filtersActive = matchFilterTeam !== "" || matchFilterStatus !== "";

  return (
    <section className="bg-slate-900 neon-border rounded-2xl p-6 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Wedstrijden</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleBulkDeleteMode}
            className={bulkDeleteMode ? BTN_SECONDARY : "text-sm text-slate-500 hover:text-slate-300 transition-colors"}
          >
            {bulkDeleteMode ? "Annuleer selectie" : "Bulk verwijderen"}
          </button>
          <button
            onClick={() => {
              loadAdminMatches();
              loadPublishMoments();
            }}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Vernieuwen
          </button>
        </div>
      </div>

      {/* Wachtrij banner */}
      {(() => {
        const pending = adminMatches.filter((m) => m.status === "PENDING");
        if (pending.length === 0) return null;
        return (
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4 border text-sm flex-wrap bg-slate-800/50 border-slate-700 text-slate-300">
            <span className="flex-1">
              <span className="font-semibold">
                {pending.length} wedstrijd{pending.length !== 1 ? "en" : ""}
              </span>{" "}
              wacht{pending.length === 1 ? "" : "en"} op goedkeuring
            </span>
            <button
              onClick={selectAllPending}
              className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              Selecteer alle ({pending.length})
            </button>
          </div>
        );
      })()}

      {(() => {
        const waiting = adminMatches.filter((m) => m.status === "APPROVED");
        if (waiting.length === 0) return null;
        const oldest = waiting.reduce((a, b) =>
          new Date(a.matchDate) < new Date(b.matchDate) ? a : b
        );
        const days = Math.floor((Date.now() - new Date(oldest.matchDate).getTime()) / 86400000);
        const urgent = days >= 7;
        return (
          <div
            className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 border text-sm flex-wrap ${
              urgent
                ? "bg-amber-900/20 border-amber-500/30 text-amber-300"
                : "bg-cyan-900/20 border-cyan-500/30 text-cyan-300"
            }`}
          >
            <span className="flex-1">
              <span className="font-semibold">
                {waiting.length} wedstrijd{waiting.length !== 1 ? "en" : ""}
              </span>{" "}
              wacht{waiting.length === 1 ? "" : "en"} op verwerking
              {urgent && (
                <span className="ml-2 text-amber-400 font-medium">
                  · oudste al {days} dagen geleden gespeeld
                </span>
              )}
            </span>
            <button
              onClick={selectAllApproved}
              className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors"
            >
              Selecteer alle ({waiting.length})
            </button>
          </div>
        );
      })()}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          {showFilters && <div className="fixed inset-0 z-20" onClick={() => setShowFilters(false)} />}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors relative z-20 ${
              showFilters ? "border-cyan-500/60 bg-cyan-500/10 text-white" :
              filtersActive ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400" : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
            }`}
          >
            Filters
            {filtersActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
            <span className="text-slate-500">{showFilters ? "▲" : "▼"}</span>
          </button>
          {showFilters && (
            <div className="absolute top-full left-0 mt-1.5 z-30 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 w-60 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Elftal</p>
                <select
                  value={matchFilterTeam}
                  onChange={(e) => setMatchFilterTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                >
                  <option value="">Alle elftallen</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>{TEAM_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Status</p>
                <select
                  value={matchFilterStatus}
                  onChange={(e) => setMatchFilterStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                >
                  <option value="">Alle statussen</option>
                  <option value="PENDING">Ingediend</option>
                  <option value="APPROVED">Goedgekeurd</option>
                  <option value="REJECTED">Afgekeurd</option>
                  <option value="PROCESSED">Verwerkt</option>
                </select>
              </div>
              {filtersActive && (
                <button
                  onClick={() => { setMatchFilterTeam(""); setMatchFilterStatus(""); }}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  Filters wissen
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* isProcessing vastgelopen banner */}
      {isProcessingStuck && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-3 border border-amber-500/40 bg-amber-900/20 text-amber-300 text-sm">
          <span className="flex-1">
            <strong>Verwerkingsvergrendeling actief.</strong> Een eerdere publicatie is vastgelopen. Reset de vergrendeling om opnieuw te kunnen publiceren.
          </span>
          <button
            onClick={resetProcessingLock}
            disabled={resettingProcessing}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {resettingProcessing ? "Resetten..." : "Reset vergrendeling"}
          </button>
        </div>
      )}

      {/* Feedback */}
      {pointsMsg && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 mb-3 border text-sm ${
            pointsMsg.type === "ok"
              ? "bg-green-900/20 border-green-500/30 text-green-400"
              : "bg-red-900/20 border-red-500/30 text-red-400"
          }`}
        >
          <span className="flex-1">{pointsMsg.text}</span>
          <button onClick={() => setPointsMsg(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">
            ×
          </button>
        </div>
      )}

      {/* Actiebalk voor geselecteerde wedstrijden (goedkeuren/afkeuren) */}
      {approveSelectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 mb-3 flex-wrap">
          <span className="text-sm text-slate-300 flex-1">
            {approveSelectedIds.size} geselecteerd voor goedkeuring
          </span>
          <button
            onClick={() => bulkApproveMatches("APPROVED")}
            disabled={bulkApproving}
            className={BTN_PRIMARY + " disabled:opacity-40 !bg-green-600 hover:!bg-green-500"}
          >
            {bulkApproving ? "Bezig..." : `Keur ${approveSelectedIds.size} goed`}
          </button>
          <button
            onClick={() => bulkApproveMatches("REJECTED")}
            disabled={bulkApproving}
            className={BTN_SECONDARY + " disabled:opacity-40 !text-amber-400"}
          >
            Wijs af
          </button>
          <button onClick={() => setApproveSelectedIds(new Set())} className={BTN_SECONDARY}>
            Deselecteer
          </button>
        </div>
      )}
      {bulkApproveError && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{bulkApproveError}</p>
      )}

      {/* Actiebalk voor geselecteerde wedstrijden */}
      {processSelectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 mb-3 flex-wrap">
          <span className="text-sm text-slate-300 flex-1">
            {processSelectedIds.size} geselecteerd voor verwerking
          </span>
          <button
            onClick={processPoints}
            disabled={processing || checkingGuests}
            className={BTN_PRIMARY + " disabled:opacity-40"}
          >
            {checkingGuests
              ? "Gastspelers checken..."
              : processing
              ? "Verwerken..."
              : `Verwerk ${processSelectedIds.size} geselecteerde`}
          </button>
          <button onClick={() => setProcessSelectedIds(new Set())} className={BTN_SECONDARY}>
            Deselecteer
          </button>
        </div>
      )}

      {/* Actiebalk voor bulk verwijderen */}
      {bulkDeleteMode && deleteSelectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-2.5 mb-3 flex-wrap">
          <div className="flex-1">
            <span className="text-sm text-red-400">
              {deleteSelectedIds.size} wedstrijd{deleteSelectedIds.size !== 1 ? "en" : ""} geselecteerd
            </span>
            {Array.from(deleteSelectedIds).some((id) => {
              const s = adminMatches.find((m) => m.id === id)?.status;
              return s === "PROCESSED";
            }) && (
              <p className="text-xs text-amber-400 mt-0.5">
                Verwerkte wedstrijden: punten worden eerst teruggedraaid, daarna verwijderd.
              </p>
            )}
          </div>
          {confirmBulkDelete ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-red-400">Zeker weten?</span>
              <button onClick={bulkDeleteMatches} disabled={bulkDeleting} className={BTN_DANGER + " disabled:opacity-50"}>
                {bulkDeleting ? "Bezig..." : "Ja, verwijder"}
              </button>
              <button onClick={() => setConfirmBulkDelete(false)} className={BTN_SMALL}>
                Annuleer
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setConfirmBulkDelete(true)} className={BTN_DANGER}>
                Verwijder selectie
              </button>
              <button onClick={() => setDeleteSelectedIds(new Set())} className={BTN_SECONDARY}>
                Deselecteer
              </button>
            </div>
          )}
        </div>
      )}
      {bulkDeleteError && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{bulkDeleteError}</p>
      )}

      {loadingMatches ? (
        <p className="text-slate-500 text-sm py-4">Laden...</p>
      ) : filteredMatches.length === 0 ? (
        <p className="text-slate-500 text-sm py-4">Geen wedstrijden gevonden.</p>
      ) : (
        <>
          {/* Mobiel: kaartjes */}
          <div className="md:hidden space-y-2">
            {sortedMatches.map((m) => {
              const isProcessable = m.status === "APPROVED";
              const isApprovable = m.status === "PENDING";
              return (
                <div
                  key={m.id}
                  id={`match-${m.id}`}
                  className={`bg-slate-800/50 rounded-xl p-3 border transition-colors ${
                    bulkDeleteMode
                      ? deleteSelectedIds.has(m.id)
                        ? "border-red-500/50 bg-red-500/5"
                        : "border-slate-700"
                      : isProcessable && processSelectedIds.has(m.id)
                      ? "border-cyan-500/50 bg-cyan-500/5"
                      : isApprovable && approveSelectedIds.has(m.id)
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {bulkDeleteMode ? (
                      <input
                        type="checkbox"
                        checked={deleteSelectedIds.has(m.id)}
                        onChange={() => toggleDeleteSelect(m.id)}
                        className="mt-0.5 accent-red-500 shrink-0"
                      />
                    ) : isProcessable ? (
                      <input
                        type="checkbox"
                        checked={processSelectedIds.has(m.id)}
                        onChange={() => toggleProcessSelect(m.id)}
                        className="mt-0.5 accent-cyan-500 shrink-0"
                      />
                    ) : isApprovable ? (
                      <input
                        type="checkbox"
                        checked={approveSelectedIds.has(m.id)}
                        onChange={() => toggleApproveSelect(m.id)}
                        className="mt-0.5 accent-green-500 shrink-0"
                      />
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-white text-sm truncate">{getOpponent(m.name, m.clubTeam)}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {TEAM_LABEL[m.clubTeam]} ·{" "}
                            {new Date(m.matchDate).toLocaleDateString("nl-NL", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            · {m.homeAway === "HOME" ? "Thuis" : m.homeAway === "AWAY" ? "Uit" : "Neutraal"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status]}`}>
                            {STATUS_LABEL[m.status]}
                          </span>
                          {(m.status === "APPROVED") &&
                            (() => {
                              const days = Math.floor(
                                (Date.now() - new Date(m.matchDate).getTime()) / 86400000
                              );
                              if (days < 3) return null;
                              return (
                                <span
                                  className={`text-xs ${days >= 7 ? "text-amber-400" : "text-slate-500"}`}
                                >
                                  {days} dagen geleden
                                </span>
                              );
                            })()}
                          <span className="text-sm font-bold text-slate-300">
                            {m.homeAway === "AWAY"
                              ? `${m.goalsConceded}–${m.goalsScored}`
                              : `${m.goalsScored}–${m.goalsConceded}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pl-6">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setMatchMenuId(matchMenuId === m.id ? null : m.id)}
                        className={BTN_SMALL}
                      >
                        Acties ▾
                      </button>
                      {matchMenuId === m.id && (
                        <div className="absolute left-0 top-8 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl min-w-[220px] overflow-hidden">
                          <MatchActionsMenu
                            match={m}
                            approvingId={approvingId}
                            revertingMatchId={revertingMatchId}
                            deletingMatchId={deletingMatchId}
                            pendingMoments={pendingMoments}
                            onEdit={() => {
                              openEditMatch(m);
                              setMatchMenuId(null);
                            }}
                            onApprove={(status) => {
                              approveMatch(m.id, status);
                              setMatchMenuId(null);
                            }}
                            onAssign={(momentId) => {
                              assignToMoment(m.id, momentId);
                              setMatchMenuId(null);
                            }}
                            onRevert={() => revertMatch(m.id)}
                            onDelete={() => deleteMatch(m.id)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: tabel */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800">
                  <th className="pb-2 w-8">
                    {bulkDeleteMode ? (
                      <input
                        type="checkbox"
                        checked={filteredMatches.length > 0 && filteredMatches.every((m) => deleteSelectedIds.has(m.id))}
                        ref={(el) => {
                          if (el)
                            el.indeterminate =
                              filteredMatches.some((m) => deleteSelectedIds.has(m.id)) &&
                              !filteredMatches.every((m) => deleteSelectedIds.has(m.id));
                        }}
                        onChange={toggleAllDeleteSelect}
                        className="accent-red-500"
                      />
                    ) : filteredMatches.some((m) => m.status === "APPROVED") ? (
                      <input
                        type="checkbox"
                        checked={
                          filteredMatches.filter(
                            (m) => m.status === "APPROVED"
                          ).length > 0 &&
                          filteredMatches
                            .filter((m) => m.status === "APPROVED")
                            .every((m) => processSelectedIds.has(m.id))
                        }
                        ref={(el) => {
                          if (el) {
                            const p = filteredMatches.filter(
                              (m) => m.status === "APPROVED"
                            );
                            el.indeterminate =
                              p.some((m) => processSelectedIds.has(m.id)) &&
                              !p.every((m) => processSelectedIds.has(m.id));
                          }
                        }}
                        onChange={toggleAllProcessSelect}
                        className="accent-cyan-500"
                      />
                    ) : (
                      filteredMatches.some((m) => m.status === "PENDING") && (
                        <input
                          type="checkbox"
                          checked={
                            filteredMatches.filter(
                              (m) => m.status === "PENDING"
                            ).length > 0 &&
                            filteredMatches
                              .filter((m) => m.status === "PENDING")
                              .every((m) => approveSelectedIds.has(m.id))
                          }
                          ref={(el) => {
                            if (el) {
                              const p = filteredMatches.filter(
                                (m) => m.status === "PENDING"
                              );
                              el.indeterminate =
                                p.some((m) => approveSelectedIds.has(m.id)) &&
                                !p.every((m) => approveSelectedIds.has(m.id));
                            }
                          }}
                          onChange={toggleAllApproveSelect}
                          className="accent-green-500"
                        />
                      )
                    )}
                  </th>
                  <th className="pb-2 font-semibold whitespace-nowrap">
                    <button onClick={() => handleSort("datum")} className="flex items-center hover:text-white transition-colors">
                      Datum <SortArrow active={sortKey === "datum"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="pb-2 font-semibold whitespace-nowrap">Thuisploeg</th>
                  <th className="pb-2 font-semibold whitespace-nowrap">Uitploeg</th>
                  <th className="pb-2 font-semibold whitespace-nowrap">Uitslag</th>
                  <th className="pb-2 font-semibold whitespace-nowrap">
                    <button onClick={() => handleSort("status")} className="flex items-center hover:text-white transition-colors">
                      Status <SortArrow active={sortKey === "status"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="pb-2 font-semibold text-right whitespace-nowrap">Acties</th>
                </tr>
              </thead>
              <tbody>
                {sortedMatches.map((m) => {
                  const isProcessable = m.status === "APPROVED";
                  const isApprovable = m.status === "PENDING";
                  const isAway = m.homeAway === "AWAY";
                  return (
                    <tr
                      key={m.id}
                      id={`match-${m.id}`}
                      className={`border-b border-slate-800/60 ${
                        bulkDeleteMode
                          ? deleteSelectedIds.has(m.id)
                            ? "bg-red-500/5"
                            : "hover:bg-slate-800/30"
                          : isProcessable && processSelectedIds.has(m.id)
                          ? "bg-cyan-500/5"
                          : isApprovable && approveSelectedIds.has(m.id)
                          ? "bg-green-500/5"
                          : "hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="py-2">
                        {bulkDeleteMode ? (
                          <input
                            type="checkbox"
                            checked={deleteSelectedIds.has(m.id)}
                            onChange={() => toggleDeleteSelect(m.id)}
                            className="accent-red-500"
                          />
                        ) : isProcessable ? (
                          <input
                            type="checkbox"
                            checked={processSelectedIds.has(m.id)}
                            onChange={() => toggleProcessSelect(m.id)}
                            className="accent-cyan-500"
                          />
                        ) : (
                          isApprovable && (
                            <input
                              type="checkbox"
                              checked={approveSelectedIds.has(m.id)}
                              onChange={() => toggleApproveSelect(m.id)}
                              className="accent-green-500"
                            />
                          )
                        )}
                      </td>
                      <td className="py-2 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(m.matchDate).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className={`py-2 whitespace-nowrap ${isAway ? "text-slate-400" : "font-semibold text-white"}`}>
                        {isAway ? getOpponent(m.name, m.clubTeam) : TEAM_LABEL[m.clubTeam] ?? m.clubTeam}
                      </td>
                      <td className={`py-2 whitespace-nowrap ${isAway ? "font-semibold text-white" : "text-slate-400"}`}>
                        {isAway ? TEAM_LABEL[m.clubTeam] ?? m.clubTeam : getOpponent(m.name, m.clubTeam)}
                      </td>
                      <td className="py-2 text-slate-400 whitespace-nowrap">
                        {m.homeAway === "AWAY"
                          ? `${m.goalsConceded}–${m.goalsScored}`
                          : `${m.goalsScored}–${m.goalsConceded}`}
                        <span className="text-xs text-slate-600 ml-1.5">
                          ({m.performances.filter((p) => p.played).length})
                        </span>
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${STATUS_STYLE[m.status]}`}
                          >
                            {STATUS_LABEL[m.status]}
                          </span>
                          {m.publishMoment && !m.publishMoment.publishedAt && (
                            <span className="text-xs text-cyan-400 truncate max-w-[140px]">
                              📅 {m.publishMoment.label}
                            </span>
                          )}
                          {(m.status === "APPROVED") &&
                            !m.publishMomentId &&
                            (() => {
                              const days = Math.floor(
                                (Date.now() - new Date(m.matchDate).getTime()) / 86400000
                              );
                              if (days < 3) return null;
                              return (
                                <span
                                  className={`text-xs ${days >= 7 ? "text-amber-400" : "text-slate-500"}`}
                                >
                                  {days}d
                                </span>
                              );
                            })()}
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              if (matchMenuId === m.id) {
                                setMatchMenuId(null);
                                return;
                              }
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDesktopMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right, anchorTop: rect.top });
                              setMatchMenuId(m.id);
                            }}
                            className={BTN_SMALL}
                          >
                            Acties ▾
                          </button>
                          {matchMenuId === m.id && desktopMenuPos && createPortal(
                            <FloatingMenu pos={desktopMenuPos}>
                              <MatchActionsMenu
                                match={m}
                                approvingId={approvingId}
                                revertingMatchId={revertingMatchId}
                                deletingMatchId={deletingMatchId}
                                pendingMoments={pendingMoments}
                                onEdit={() => {
                                  openEditMatch(m);
                                  setMatchMenuId(null);
                                }}
                                onApprove={(status) => {
                                  approveMatch(m.id, status);
                                  setMatchMenuId(null);
                                }}
                                onAssign={(momentId) => {
                                  assignToMoment(m.id, momentId);
                                  setMatchMenuId(null);
                                }}
                                onRevert={() => revertMatch(m.id)}
                                onDelete={() => deleteMatch(m.id)}
                              />
                            </FloatingMenu>,
                            document.body
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
