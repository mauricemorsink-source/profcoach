import type { Dispatch, SetStateAction } from "react";
import type { AdminMatch, PublishMoment } from "./types";
import { TEAM_LABEL } from "./constants";

type Props = {
  publishMoments: PublishMoment[];
  adminMatches: AdminMatch[];
  showProcessedMoments: boolean;
  setShowProcessedMoments: Dispatch<SetStateAction<boolean>>;
  setNewMomentForm: (v: { label: string; scheduledAt: string }) => void;
  setNewMomentModal: (v: boolean) => void;
  publishMoment: (id: string) => void;
  publishingMomentId: string | null;
  checkingConflicts: boolean;
  deleteMoment: (id: string) => void;
  deletingMomentId: string | null;
};

export default function PublishMomentsPanel({
  publishMoments,
  adminMatches,
  showProcessedMoments,
  setShowProcessedMoments,
  setNewMomentForm,
  setNewMomentModal,
  publishMoment,
  publishingMomentId,
  checkingConflicts,
  deleteMoment,
  deletingMomentId,
}: Props) {
  return (
    <aside className="hidden lg:flex flex-col gap-3 w-72 shrink-0">
      <div className="bg-slate-900 neon-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Publicatieplanning</h2>
          <button
            onClick={() => {
              setNewMomentForm({ label: "", scheduledAt: "" });
              setNewMomentModal(true);
            }}
            className="px-2.5 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors"
          >
            + Nieuw
          </button>
        </div>
        {(() => {
          const pending = publishMoments.filter((pm) => !pm.publishedAt);
          const processed = publishMoments.filter((pm) => pm.publishedAt);
          return (
            <div className="space-y-2">
              {pending.length === 0 && processed.length === 0 && (
                <p className="text-slate-500 text-xs">Nog geen momenten aangemaakt.</p>
              )}
              {pending.map((pm) => {
                const approvedInMoment = adminMatches.filter(
                  (m) => m.publishMomentId === pm.id && m.status === "APPROVED"
                );
                const allInMoment = adminMatches.filter((m) => m.publishMomentId === pm.id);
                const isPast = new Date(pm.scheduledAt) <= new Date();
                return (
                  <div
                    key={pm.id}
                    className={`rounded-xl border p-3 ${
                      isPast
                        ? "border-amber-500/30 bg-amber-900/10"
                        : "border-slate-700 bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-white text-sm leading-tight">{pm.label}</span>
                      {isPast ? (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-500/30 shrink-0">
                          Wacht
                        </span>
                      ) : (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                          Gepland
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      {new Date(pm.scheduledAt).toLocaleString("nl-NL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/Amsterdam",
                      })}
                    </p>
                    <p className="text-xs text-slate-400 mb-2">
                      {allInMoment.length} wedstrijd{allInMoment.length !== 1 ? "en" : ""}
                      {approvedInMoment.length > 0 && (
                        <span className="text-green-400 ml-1">· {approvedInMoment.length} klaar</span>
                      )}
                    </p>
                    {allInMoment.length > 0 && (
                      <div className="space-y-0.5 mb-2">
                        {allInMoment.map((m) => (
                          <div key={m.id} className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                m.status === "APPROVED"
                                  ? "bg-green-400"
                                  : m.status === "PENDING"
                                  ? "bg-amber-400"
                                  : "bg-slate-600"
                              }`}
                            />
                            <span className="text-xs text-slate-400 truncate">
                              {TEAM_LABEL[m.clubTeam] ?? m.clubTeam} vs {m.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => publishMoment(pm.id)}
                        disabled={
                          publishingMomentId === pm.id ||
                          checkingConflicts ||
                          approvedInMoment.length === 0
                        }
                        className="flex-1 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-40"
                      >
                        {publishingMomentId === pm.id
                          ? "Verwerken..."
                          : checkingConflicts
                          ? "Controleren..."
                          : `Publiceer (${approvedInMoment.length})`}
                      </button>
                      <button
                        onClick={() => deleteMoment(pm.id)}
                        disabled={deletingMomentId === pm.id}
                        className="px-2.5 py-1.5 text-xs bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors border border-red-500/20"
                      >
                        {deletingMomentId === pm.id ? "..." : "✕"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {processed.length > 0 && (
                <div className="border border-slate-700/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowProcessedMoments((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/40 hover:bg-slate-800/70 transition-colors text-left"
                  >
                    <span className="text-xs font-medium text-slate-400">
                      Verwerkt ({processed.length})
                    </span>
                    <span className="text-slate-600 text-xs">{showProcessedMoments ? "▲" : "▼"}</span>
                  </button>
                  {showProcessedMoments && (
                    <div className="divide-y divide-slate-700/40">
                      {processed.map((pm) => (
                        <div key={pm.id} className="flex items-center gap-2 px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-slate-400 truncate block">
                              {pm.label}
                            </span>
                            <span className="text-xs text-slate-600">
                              {new Date(pm.publishedAt!).toLocaleString("nl-NL", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Europe/Amsterdam",
                              })}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteMoment(pm.id)}
                            disabled={deletingMomentId === pm.id}
                            title="Verwijderen"
                            className="px-2 py-1.5 text-xs bg-red-900/20 text-red-500 rounded hover:bg-red-900/40 transition-colors border border-red-500/20 shrink-0"
                          >
                            {deletingMomentId === pm.id ? "..." : "✕"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </aside>
  );
}
