import type { Dispatch, SetStateAction } from "react";
import type { GuestAppearance } from "./types";
import { POSITION_LABEL, POSITION_COLOR, TEAM_LABEL, BTN_PRIMARY, BTN_SECONDARY } from "./constants";

type Props = {
  guestPreview: { appearances: GuestAppearance[]; body: string | undefined };
  ambiguousResolutions: Record<string, Set<string>>;
  setAmbiguousResolutions: Dispatch<SetStateAction<Record<string, Set<string>>>>;
  setGuestPreview: Dispatch<SetStateAction<{ appearances: GuestAppearance[]; body: string | undefined } | null>>;
  doProcessPoints: (body: string | undefined, excludedPerformances: { matchId: string; playerId: string }[]) => void;
  processing: boolean;
};

export default function GuestPreviewModal({
  guestPreview,
  ambiguousResolutions,
  setAmbiguousResolutions,
  setGuestPreview,
  doProcessPoints,
  processing,
}: Props) {
  const ambiguousAppearances = guestPreview.appearances.filter((a) => a.ambiguous);
  const allResolved = ambiguousAppearances.every((a) => (ambiguousResolutions[a.playerId]?.size ?? 0) > 0);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">Gastspeler-check</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Deze spelers speelden dezelfde dag bij twee elftallen. De wedstrijd van hun eigen elftal telt mee, de rest niet.
            </p>
          </div>
          <button
            onClick={() => setGuestPreview(null)}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {guestPreview.appearances.map((a) => (
            <div key={`${a.playerId}-${a.day}`} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-semibold text-white">{a.playerName}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${POSITION_COLOR[a.playerPosition] ?? "text-slate-400"}`}>
                  {POSITION_LABEL[a.playerPosition] ?? a.playerPosition}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(a.day).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                </span>
                {a.ambiguous && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-500/30 font-medium">
                    Kies welke telt
                  </span>
                )}
              </div>
              <div className="space-y-1.5 mt-2">
                {a.matches.map((m) => {
                  const isSelected = a.ambiguous
                    ? (ambiguousResolutions[a.playerId]?.has(m.matchId) ?? false)
                    : m.counts;
                  const content = (
                    <>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-200 truncate">{m.matchName}</p>
                        <p className="text-xs text-slate-500">
                          {TEAM_LABEL[m.matchClubTeam] ?? m.matchClubTeam}
                          {m.isOwnTeam && " · eigen elftal"} · {m.points} punten
                        </p>
                      </div>
                      {a.ambiguous ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setAmbiguousResolutions((prev) => {
                              const next = new Set(prev[a.playerId] ?? []);
                              next.has(m.matchId) ? next.delete(m.matchId) : next.add(m.matchId);
                              return { ...prev, [a.playerId]: next };
                            });
                          }}
                          className="accent-cyan-500 shrink-0"
                        />
                      ) : m.counts ? (
                        <span className="text-xs font-semibold text-green-400 shrink-0">✓ Telt mee</span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500 shrink-0">✗ Telt niet mee</span>
                      )}
                    </>
                  );
                  const rowClass = `flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                    a.ambiguous
                      ? isSelected
                        ? "border-cyan-500/40 bg-cyan-900/10"
                        : "border-slate-700 bg-slate-800/60"
                      : m.counts
                      ? "border-green-500/30 bg-green-900/10"
                      : "border-slate-700 bg-slate-800/60"
                  }`;
                  return a.ambiguous ? (
                    <label key={m.matchId} className={rowClass + " cursor-pointer"}>{content}</label>
                  ) : (
                    <div key={m.matchId} className={rowClass}>{content}</div>
                  );
                })}
              </div>
              {a.ambiguous && (ambiguousResolutions[a.playerId]?.size ?? 0) === 0 && (
                <p className="text-xs text-amber-400 mt-2">Kies minimaal één wedstrijd die meetelt voor {a.playerName}.</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
          <button onClick={() => setGuestPreview(null)} className={BTN_SECONDARY}>
            Annuleer
          </button>
          <button
            onClick={() => {
              const excludedPerformances: { matchId: string; playerId: string }[] = [];
              for (const a of ambiguousAppearances) {
                const selected = ambiguousResolutions[a.playerId] ?? new Set<string>();
                for (const m of a.matches) {
                  if (!selected.has(m.matchId)) excludedPerformances.push({ matchId: m.matchId, playerId: a.playerId });
                }
              }
              doProcessPoints(guestPreview.body, excludedPerformances);
            }}
            disabled={processing || !allResolved}
            className={BTN_PRIMARY + " disabled:opacity-40 ml-auto"}
          >
            {processing ? "Verwerken..." : "Doorgaan met verwerken"}
          </button>
        </div>
      </div>
    </div>
  );
}
