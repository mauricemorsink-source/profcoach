"use client";

import { useState } from "react";

type Match = {
  id: string;
  name: string;
  matchDate: string;
  clubTeam: string;
  publishMoment: { label: string } | null;
};

type Formation = {
  code: string;
  defenders: number;
  midfielders: number;
  attackers: number;
};

type TotWPlayer = {
  playerId: string;
  name: string;
  shortName: string | null;
  position: string;
  clubTeam: string;
  points: number;
};

type TotWResult = {
  formation: Formation;
  players: TotWPlayer[];
};

const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

const TEAM_SHORT: Record<string, string> = {
  ONE: "R1", TWO: "R2", THREE: "R3", FOUR: "R4", FIVE: "R5", DAMES: "VR1",
};

function displayName(player: TotWPlayer): string {
  const raw = player.shortName ?? player.name.split(" ").at(-1) ?? player.name;
  return raw.length > 11 ? raw.slice(0, 10) + "." : raw;
}

function Shirt() {
  return (
    <svg width="44" height="48" viewBox="0 0 44 48" fill="none">
      <path
        d="M18 3 L5 9 L3 20 L13 18 L13 45 L31 45 L31 18 L41 20 L39 9 L26 3 Q22 9 18 3 Z"
        fill="#1d4ed8"
        stroke="#60a5fa"
        strokeWidth="1.5"
      />
      <path
        d="M18 3 Q22 9 26 3"
        fill="#1e3a8a"
        stroke="#93c5fd"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function EmptyShirt() {
  return (
    <svg width="44" height="48" viewBox="0 0 44 48" fill="none">
      <path
        d="M18 3 L5 9 L3 20 L13 18 L13 45 L31 45 L31 18 L41 20 L39 9 L26 3 Q22 9 18 3 Z"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
    </svg>
  );
}

function Pitch({ totw }: { totw: TotWResult }) {
  const { formation, players } = totw;

  const rows: { pos: string; count: number; yPct: number }[] = [
    { pos: "ATT", count: formation.attackers, yPct: 22 },
    { pos: "MID", count: formation.midfielders, yPct: 43 },
    { pos: "DEF", count: formation.defenders, yPct: 63 },
    { pos: "GK",  count: 1,                   yPct: 82 },
  ];

  const playersByPos: Record<string, TotWPlayer[]> = { GK: [], DEF: [], MID: [], ATT: [] };
  for (const p of players) playersByPos[p.position]?.push(p);

  const slots: { player: TotWPlayer | null; xPct: number; yPct: number }[] = [];
  for (const row of rows) {
    const rowPlayers = playersByPos[row.pos] ?? [];
    for (let i = 0; i < row.count; i++) {
      slots.push({
        player: rowPlayers[i] ?? null,
        xPct: ((i + 1) / (row.count + 1)) * 100,
        yPct: row.yPct,
      });
    }
  }

  const formationLabel = `${formation.defenders}-${formation.midfielders}-${formation.attackers}`;

  return (
    <div
      className="relative rounded-2xl overflow-hidden select-none"
      style={{
        background: "linear-gradient(180deg, #1a5c1a 0%, #237323 40%, #1a5c1a 100%)",
        aspectRatio: "3/4",
        maxWidth: "420px",
        width: "100%",
      }}
    >
      {/* Pitch markings */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 300 400"
        preserveAspectRatio="xMidYMid meet"
        style={{ opacity: 0.25 }}
      >
        <rect x="18" y="18" width="264" height="364" fill="none" stroke="white" strokeWidth="2" />
        <line x1="18" y1="200" x2="282" y2="200" stroke="white" strokeWidth="1.5" />
        <circle cx="150" cy="200" r="44" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="150" cy="200" r="3" fill="white" />
        <rect x="82" y="18" width="136" height="64" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="82" y="318" width="136" height="64" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="116" y="18" width="68" height="26" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="116" y="356" width="68" height="26" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="150" cy="65" r="2.5" fill="white" />
        <circle cx="150" cy="335" r="2.5" fill="white" />
      </svg>

      {/* Title bar */}
      <div
        className="absolute top-0 left-0 right-0 py-2.5 text-center z-10"
        style={{ background: "rgba(0,0,0,0.45)" }}
      >
        <div className="text-white font-black text-sm tracking-[0.18em] drop-shadow">
          TEAM OF THE WEEK
        </div>
        <div className="text-blue-300 text-[10px] font-semibold tracking-widest uppercase mt-0.5">
          Profcoach Rietmolen
        </div>
      </div>

      {/* Players */}
      {slots.map(({ player, xPct, yPct }, i) => (
        <div
          key={i}
          className="absolute flex flex-col items-center z-10"
          style={{ left: `${xPct}%`, top: `${yPct}%`, transform: "translate(-50%, -50%)" }}
        >
          {player ? <Shirt /> : <EmptyShirt />}
          <div className="text-center mt-0.5" style={{ minWidth: "56px" }}>
            <div
              className="text-white text-xs font-bold leading-tight text-center"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
            >
              {player ? displayName(player) : "—"}
            </div>
            {player && (
              <div
                className="text-blue-200 text-[9px] font-semibold"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
              >
                {TEAM_SHORT[player.clubTeam] ?? ""}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Formation label */}
      <div
        className="absolute bottom-2 right-3 text-[11px] font-bold z-10"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        {formationLabel}
      </div>
    </div>
  );
}

export default function TotWClient({
  matches,
  formations,
}: {
  matches: Match[];
  formations: Formation[];
}) {
  const defaultFormation = formations.find((f) => f.code === "433") ?? formations[0] ?? null;

  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(defaultFormation);
  const [totw, setTotw] = useState<TotWResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group matches by match date (day)
  const groups = new Map<string, Match[]>();
  for (const match of matches) {
    const key = new Date(match.matchDate).toLocaleDateString("nl-NL", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(match);
  }

  function toggleMatch(id: string) {
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setTotw(null);
  }

  function toggleGroup(groupMatches: Match[]) {
    const allSelected = groupMatches.every((m) => selectedMatchIds.has(m.id));
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupMatches.forEach((m) => next.delete(m.id));
      } else {
        groupMatches.forEach((m) => next.add(m.id));
      }
      return next;
    });
    setTotw(null);
  }

  async function generate() {
    if (selectedMatchIds.size === 0 || !selectedFormation) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/totw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchIds: Array.from(selectedMatchIds),
          formationCode: selectedFormation.code,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Er is een fout opgetreden");
      } else {
        setTotw(data);
      }
    } catch {
      setError("Verbindingsfout");
    } finally {
      setLoading(false);
    }
  }

  const BTN = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors";

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-black text-white">Team of the Week</h1>
      </div>

      {matches.length === 0 ? (
        <div className="bg-slate-900 neon-border rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm">Nog geen verwerkte wedstrijden beschikbaar.</p>
        </div>
      ) : (
        <>
          {/* Step 1: Match selection */}
          <section className="bg-slate-900 neon-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4">
              1. Selecteer wedstrijden
              {selectedMatchIds.size > 0 && (
                <span className="ml-2 text-cyan-400 font-normal">({selectedMatchIds.size} geselecteerd)</span>
              )}
            </h2>
            <div className="space-y-4">
              {Array.from(groups.entries()).map(([label, groupMatches]) => {
                const allSelected = groupMatches.every((m) => selectedMatchIds.has(m.id));
                const someSelected = groupMatches.some((m) => selectedMatchIds.has(m.id));
                return (
                  <div key={label}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-slate-400 capitalize">{label}</span>
                      <button
                        onClick={() => toggleGroup(groupMatches)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors border ${
                          allSelected
                            ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                            : someSelected
                            ? "bg-slate-700 text-slate-300 border-slate-600"
                            : "text-slate-600 border-slate-700 hover:text-slate-400"
                        }`}
                      >
                        {allSelected ? "Alles uit" : "Alles aan"}
                      </button>
                    </div>
                    <div className="space-y-1 pl-1">
                      {groupMatches.map((match) => {
                        const checked = selectedMatchIds.has(match.id);
                        return (
                          <label
                            key={match.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              checked ? "bg-cyan-500/10 border border-cyan-500/20" : "hover:bg-slate-800"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMatch(match.id)}
                              className="accent-cyan-500 w-4 h-4 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-white font-medium">{match.name}</span>
                            </div>
                            <span className="text-slate-400 text-xs shrink-0">
                              {TEAM_LABEL[match.clubTeam] ?? match.clubTeam}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Step 2: Formation */}
          <section className="bg-slate-900 neon-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-3">2. Kies formatie</h2>
            <div className="flex flex-wrap gap-2">
              {formations.map((f) => {
                const label = `${f.defenders}-${f.midfielders}-${f.attackers}`;
                const active = selectedFormation?.code === f.code;
                return (
                  <button
                    key={f.code}
                    onClick={() => { setSelectedFormation(f); setTotw(null); }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                      active
                        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                        : "text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Generate button */}
          <div className="flex items-center gap-3">
            <button
              onClick={generate}
              disabled={loading || selectedMatchIds.size === 0 || !selectedFormation}
              className={BTN}
            >
              {loading ? "Laden..." : "Genereer Team of the Week"}
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>

          {/* Pitch display */}
          {totw && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Team of the Week</h2>
                <span className="text-slate-500 text-xs">Screenshot dit gedeelte om te delen</span>
              </div>
              <Pitch totw={totw} />
              <div className="bg-slate-900 neon-border rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Selectie</p>
                <div className="space-y-1">
                  {totw.players.map((p) => (
                    <div key={p.playerId} className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500 w-8 text-xs">{p.position}</span>
                      <span className="text-white font-medium flex-1">{p.name}</span>
                      <span className="text-slate-400 text-xs">{TEAM_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                      <span className="text-cyan-400 font-bold w-12 text-right">{p.points} pt</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
