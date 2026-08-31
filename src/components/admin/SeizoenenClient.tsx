"use client";

import { useState, useEffect } from "react";

type Season = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count: { teamEntries: number; matches: number };
};

const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SMALL = "px-3 py-1.5 text-xs bg-slate-800 text-slate-400 rounded hover:bg-slate-700 font-medium border border-slate-700 transition-colors disabled:opacity-50";

export default function SeizoenenClient() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [confirmNew, setConfirmNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [confirmActivateId, setConfirmActivateId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function loadSeasons() {
    setLoading(true);
    const res = await fetch("/api/admin/seasons");
    if (res.ok) setSeasons(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadSeasons();
  }, []);

  async function startNewSeason() {
    if (!newName.trim()) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    setConfirmNew(false);
    if (!res.ok) {
      setMsg({ type: "err", text: data.error || "Opslaan mislukt" });
    } else {
      setNewName("");
      setMsg({ type: "ok", text: `Seizoen "${data.name}" is nu actief. Spelinstellingen (deadline, registratie, wijzigingsvenster) zijn teruggezet — stel die opnieuw in bij Spelinstellingen.` });
      await loadSeasons();
    }
  }

  async function activateSeason(id: string) {
    setActivatingId(id);
    setMsg(null);
    const res = await fetch(`/api/admin/seasons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activate: true }),
    });
    const data = await res.json();
    setActivatingId(null);
    setConfirmActivateId(null);
    if (!res.ok) {
      setMsg({ type: "err", text: data.error || "Activeren mislukt" });
    } else {
      setMsg({ type: "ok", text: `Seizoen "${data.name}" is nu actief.` });
      await loadSeasons();
    }
  }

  return (
    <div className="max-w-4xl">
    <section className="bg-slate-900 neon-border rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-1">Seizoenen</h2>
      <p className="text-slate-500 text-sm mb-5">
        Er is altijd precies één actief seizoen — daar draait de hele app op (teams, wedstrijden, tussenstand).
        Een nieuw seizoen starten sluit automatisch het huidige seizoen af; bestaande data blijft gewoon bewaard.
      </p>

      {loading ? (
        <p className="text-slate-500 text-sm">Laden...</p>
      ) : (
        <div className="space-y-2 mb-5">
          {seasons.map((s) => (
            <div
              key={s.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 ${
                s.isActive ? "bg-cyan-900/10 border-cyan-500/30" : "bg-slate-800/40 border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{s.name}</span>
                  {s.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-900/40 text-green-400 border border-green-500/30">
                      Actief
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {s._count.teamEntries} deelnemer{s._count.teamEntries !== 1 ? "s" : ""} ·{" "}
                  {s._count.matches} wedstrijd{s._count.matches !== 1 ? "en" : ""} · gestart{" "}
                  {new Date(s.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {!s.isActive && (
                confirmActivateId === s.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400">Dit sluit het huidige seizoen af. Zeker weten?</span>
                    <button onClick={() => activateSeason(s.id)} disabled={activatingId === s.id} className={BTN_SMALL}>
                      {activatingId === s.id ? "..." : "Ja, activeer"}
                    </button>
                    <button onClick={() => setConfirmActivateId(null)} className={BTN_SMALL}>
                      Annuleer
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmActivateId(s.id)} className={BTN_SMALL}>
                    Activeren
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-800 pt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Nieuw seizoen starten</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="bijv. 2027/28"
            className={INPUT + " max-w-xs"}
          />
          {confirmNew ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400">Sluit het huidige seizoen af. Zeker weten?</span>
              <button onClick={startNewSeason} disabled={saving || !newName.trim()} className={BTN_PRIMARY}>
                {saving ? "Bezig..." : "Ja, start seizoen"}
              </button>
              <button onClick={() => setConfirmNew(false)} className={BTN_SMALL}>
                Annuleer
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmNew(true)} disabled={!newName.trim()} className={BTN_PRIMARY}>
              Nieuw seizoen starten
            </button>
          )}
        </div>
      </div>

      {msg && (
        <p
          className={`mt-4 text-sm px-3 py-2 rounded-lg border ${
            msg.type === "ok"
              ? "bg-green-900/20 text-green-400 border-green-500/30"
              : "bg-red-900/20 text-red-400 border-red-500/30"
          }`}
        >
          {msg.text}
        </p>
      )}
    </section>
    </div>
  );
}
