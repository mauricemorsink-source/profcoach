"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DeelnemerStanding = {
  id: string;
  userName: string;
  totalPoints: number;
  prevPoints: number;
  delta: number;
};

type Scope = "BOTH" | "STAND" | "STATISTIEKEN";

type Publication = {
  id: string;
  label: string | null;
  scope: Scope;
  revealAt: string;
  matchesAsOf: string | null;
  createdAt: string;
  createdBy: { name: string | null; email: string } | null;
  data: { deelnemers?: DeelnemerStanding[]; stats?: unknown };
};

type ConfirmAction = { type: "publish"; scope: Scope } | { type: "restore"; publication: Publication };

const SCOPE_LABEL: Record<Scope, string> = {
  BOTH: "stand + statistieken",
  STAND: "stand",
  STATISTIEKEN: "statistieken",
};

const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700";
const BTN_SMALL = "px-3 py-1.5 text-xs bg-slate-800 text-slate-400 rounded hover:bg-slate-700 font-medium border border-slate-700 transition-colors";

function fmt(date: string | Date) {
  return new Date(date).toLocaleString("nl-NL", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam",
  });
}

function covers(scope: Scope, part: "STAND" | "STATISTIEKEN") {
  return scope === "BOTH" || scope === part;
}

export default function StandingsPublishPanel({ liveStandings }: { liveStandings: DeelnemerStanding[] }) {
  const router = useRouter();
  const [history, setHistory] = useState<Publication[] | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadHistory() {
    const res = await fetch("/api/admin/standings/history");
    if (res.ok) setHistory(await res.json());
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const past = (history ?? []).slice().sort((a, b) => new Date(b.revealAt).getTime() - new Date(a.revealAt).getTime());
  // Huidig = de meest recente publicatie die dat onderdeel bevat.
  const currentStand = past.find((p) => covers(p.scope, "STAND")) ?? null;
  const currentStats = past.find((p) => covers(p.scope, "STATISTIEKEN")) ?? null;

  async function executeConfirm() {
    if (!confirmAction) return;
    setBusy(true);
    setError("");
    try {
      if (confirmAction.type === "restore") {
        const res = await fetch(`/api/admin/standings/${confirmAction.publication.id}/restore`, { method: "POST" });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Herstellen mislukt");
      } else {
        const res = await fetch("/api/admin/standings/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: confirmAction.scope }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Publiceren mislukt");
      }
      setConfirmAction(null);
      await loadHistory();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis");
    } finally {
      setBusy(false);
    }
  }

  const previewScope: Scope = confirmAction?.type === "publish" ? confirmAction.scope : confirmAction?.type === "restore" ? confirmAction.publication.scope : "BOTH";
  const previewStandings = confirmAction?.type === "restore" ? confirmAction.publication.data.deelnemers ?? [] : liveStandings;

  return (
    <div className="bg-slate-900 neon-border rounded-2xl p-4 space-y-4">
      <div>
        <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wide">Admin — live stand</p>
        <p className="text-sm text-slate-400 mt-0.5">
          Stand: {currentStand ? `deelnemers zien de stand van ${fmt(currentStand.revealAt)}${currentStand.label ? ` (${currentStand.label})` : ""}` : "nog niet gepubliceerd"}
        </p>
        <p className="text-sm text-slate-400">
          Statistieken: {currentStats ? `deelnemers zien de statistieken van ${fmt(currentStats.revealAt)}${currentStats.label ? ` (${currentStats.label})` : ""}` : "nog niet gepubliceerd"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setConfirmAction({ type: "publish", scope: "STAND" })} className={BTN_PRIMARY}>
          Publiceer stand
        </button>
        <button onClick={() => setConfirmAction({ type: "publish", scope: "STATISTIEKEN" })} className={BTN_PRIMARY}>
          Publiceer statistieken
        </button>
        <button onClick={() => setConfirmAction({ type: "publish", scope: "BOTH" })} className={BTN_SECONDARY}>
          Publiceer beide
        </button>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      {past.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Geschiedenis</p>
          <div className="space-y-2">
            {past.map((p) => {
              const isCurrent =
                (!covers(p.scope, "STAND") || currentStand?.id === p.id) &&
                (!covers(p.scope, "STATISTIEKEN") || currentStats?.id === p.id);
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-300">
                      {fmt(p.revealAt)}
                      {currentStand?.id === p.id && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 font-bold align-middle">HUIDIG STAND</span>}
                      {currentStats?.id === p.id && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-500/30 font-bold align-middle">HUIDIG STATS</span>}
                    </p>
                    <p className="text-xs text-slate-500">
                      {SCOPE_LABEL[p.scope]}
                      {p.label ? ` · ${p.label}` : ""}
                      {p.matchesAsOf ? ` · wedstrijden verwerkt t/m ${fmt(p.matchesAsOf)}` : " · geen wedstrijden verwerkt"}
                      {p.createdBy?.name ? ` · door ${p.createdBy.name}` : ""}
                    </p>
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => setConfirmAction({ type: "restore", publication: p })}
                      disabled={busy}
                      className={BTN_SMALL + " shrink-0"}
                    >
                      Herstel deze versie
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl p-5">
            <h3 className="text-base font-bold text-white mb-1">
              {confirmAction.type === "restore" ? "Versie herstellen?" : `${SCOPE_LABEL[confirmAction.scope].replace(/^./, (c) => c.toUpperCase())} publiceren?`}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {confirmAction.type === "publish" &&
                `De huidige ${SCOPE_LABEL[confirmAction.scope]} wordt meteen zichtbaar voor alle deelnemers. Het andere onderdeel blijft ongewijzigd.`}
              {confirmAction.type === "restore" &&
                `De ${SCOPE_LABEL[confirmAction.publication.scope]} van ${fmt(confirmAction.publication.revealAt)} wordt opnieuw ingesteld als de zichtbare versie voor deelnemers.`}
            </p>
            {covers(previewScope, "STAND") && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 mb-4 max-h-40 overflow-y-auto">
                {previewStandings.slice(0, 5).map((d, i) => (
                  <div key={d.id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-slate-300">{i + 1}. {d.userName}</span>
                    <span className="text-cyan-400 font-semibold">{d.totalPoints} pt</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button onClick={() => setConfirmAction(null)} className={BTN_SECONDARY}>
                Annuleer
              </button>
              <button onClick={executeConfirm} disabled={busy} className={BTN_PRIMARY + " ml-auto"}>
                {busy ? "Bezig..." : "Bevestig"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
