"use client";

import { useState, useEffect, useMemo } from "react";

type Player = {
  id: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "ATT";
  clubTeam: string;
  value: number;
};

const CLUB_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1",
  TWO: "Rietmolen 2",
  THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4",
  FIVE: "Rietmolen 5",
  DAMES: "Rietmolen VR1",
};

const POSITION_LABEL: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};

const POSITION_COLOR: Record<string, string> = {
  GK:  "text-amber-400 bg-amber-900/30 border-amber-500/30",
  DEF: "text-blue-400 bg-blue-900/30 border-blue-500/30",
  MID: "text-green-400 bg-green-900/30 border-green-500/30",
  ATT: "text-red-400 bg-red-900/30 border-red-500/30",
};

const CLUB_ORDER = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];
const POS_ORDER  = ["GK", "DEF", "MID", "ATT"];

const POSITIONS = [
  { value: "", label: "Alle posities" },
  { value: "GK",  label: "DM" },
  { value: "DEF", label: "VER" },
  { value: "MID", label: "MID" },
  { value: "ATT", label: "AAN" },
];

const CLUBS = [
  { value: "", label: "Alle elftallen" },
  ...CLUB_ORDER.map((c) => ({ value: c, label: CLUB_LABEL[c] })),
];

export default function SpelerslijstClient({ players }: { players: Player[] }) {
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState("");
  const [filterClub, setFilterClub] = useState("");
  const [myTeamIds, setMyTeamIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("profcoach_team_slots");
      if (raw) {
        const parsed: (string | null)[] = JSON.parse(raw);
        setMyTeamIds(new Set(parsed.filter(Boolean) as string[]));
      }
    } catch { /* negeer */ }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players
      .filter((p) => {
        if (filterPos && p.position !== filterPos) return false;
        if (filterClub && p.clubTeam !== filterClub) return false;
        if (q && !p.name.toLowerCase().includes(q) && !(CLUB_LABEL[p.clubTeam] ?? "").toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const clubDiff = CLUB_ORDER.indexOf(a.clubTeam) - CLUB_ORDER.indexOf(b.clubTeam);
        if (clubDiff !== 0) return clubDiff;
        const posDiff = POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position);
        if (posDiff !== 0) return posDiff;
        return a.name.localeCompare(b.name, "nl");
      });
  }, [players, search, filterPos, filterClub]);

  const inTeam = filtered.filter((p) => myTeamIds.has(p.id));
  const notInTeam = filtered.filter((p) => !myTeamIds.has(p.id));
  const hasTeam = myTeamIds.size > 0;

  return (
    <div className="min-h-screen bg-[#060b14]">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-16">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Spelerslijst</h1>
          <p className="text-slate-400 text-sm mt-1">
            Zoek en vergelijk spelers voor je opstelling.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Zoek op naam of elftal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
          <select
            value={filterPos}
            onChange={(e) => setFilterPos(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          >
            {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select
            value={filterClub}
            onChange={(e) => setFilterClub(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          >
            {CLUBS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <p className="text-xs text-slate-600 mb-4">
          {filtered.length} speler{filtered.length !== 1 ? "s" : ""}
          {(search || filterPos || filterClub) ? " gevonden" : " totaal"}
        </p>

        {/* Tabel */}
        <div className="bg-slate-900 neon-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-3 font-semibold">Naam</th>
                <th className="px-3 py-3 font-semibold">Pos</th>
                <th className="px-3 py-3 font-semibold hidden sm:table-cell">Elftal</th>
                <th className="px-4 py-3 font-semibold text-right">€</th>
              </tr>
            </thead>
            <tbody>
              {/* Spelers in mijn opstelling bovenaan */}
              {hasTeam && inTeam.length > 0 && (
                <>
                  <tr>
                    <td colSpan={4} className="px-4 py-1.5 bg-cyan-900/10 border-y border-cyan-500/15">
                      <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest">In jouw opstelling</span>
                    </td>
                  </tr>
                  {inTeam.map((p) => (
                    <PlayerRow key={p.id} player={p} inTeam={true} />
                  ))}
                  {notInTeam.length > 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-1.5 bg-slate-800/30 border-y border-slate-700/40">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Overige spelers</span>
                      </td>
                    </tr>
                  )}
                </>
              )}
              {(hasTeam ? notInTeam : filtered).map((p) => (
                <PlayerRow key={p.id} player={p} inTeam={false} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                    Geen spelers gevonden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tip */}
        {hasTeam && (
          <p className="text-xs text-slate-600 mt-3 text-center">
            Spelers uit jouw opgeslagen opstelling staan bovenaan.
          </p>
        )}
      </div>
    </div>
  );
}

function PlayerRow({ player, inTeam }: { player: Player; inTeam: boolean }) {
  return (
    <tr className={`border-b border-slate-800/60 transition-colors ${inTeam ? "bg-cyan-500/5 hover:bg-cyan-500/10" : "hover:bg-slate-800/30"}`}>
      <td className="px-4 py-2.5 font-medium text-white">
        {player.name}
        {inTeam && (
          <span className="ml-2 text-[10px] bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-full font-bold">✓</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${POSITION_COLOR[player.position] ?? "text-slate-400"}`}>
          {POSITION_LABEL[player.position] ?? player.position}
        </span>
      </td>
      <td className="px-3 py-2.5 text-slate-400 text-xs hidden sm:table-cell">
        {CLUB_LABEL[player.clubTeam] ?? player.clubTeam}
      </td>
      <td className="px-4 py-2.5 text-right font-bold text-cyan-400">
        {player.value}
      </td>
    </tr>
  );
}
