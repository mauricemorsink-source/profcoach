import type { Player } from "../types";
import { CLUB_LABEL } from "../validate";
import { CLUB_ORDER, POS_ORDER } from "./constants";

export default function PredPlayerPicker({
  field, value, onSelect, players, predActiveField, setPredActiveField, predSearch, setPredSearch,
}: {
  field: "topscorer" | "assistkoning";
  value: string | null;
  onSelect: (id: string) => void;
  players: Player[];
  predActiveField: "topscorer" | "assistkoning" | null;
  setPredActiveField: (field: "topscorer" | "assistkoning" | null) => void;
  predSearch: string;
  setPredSearch: (value: string) => void;
}) {
  const isOpen = predActiveField === field;
  const filteredPlayers = players
    .filter(p => !predSearch.trim() || p.name.toLowerCase().includes(predSearch.toLowerCase()) || CLUB_LABEL[p.clubTeam]?.toLowerCase().includes(predSearch.toLowerCase()))
    .sort((a, b) => {
      const clubDiff = CLUB_ORDER.indexOf(a.clubTeam) - CLUB_ORDER.indexOf(b.clubTeam);
      if (clubDiff !== 0) return clubDiff;
      const posDiff = POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position);
      if (posDiff !== 0) return posDiff;
      return a.name.localeCompare(b.name, "nl");
    });

  return (
    <div className="relative">
      {/* Transparante overlay om buiten-klik te vangen */}
      {isOpen && (
        <div className="fixed inset-0 z-[45]" onClick={() => { setPredActiveField(null); setPredSearch(""); }} />
      )}

      {/* Trigger knop — blijft altijd op dezelfde plek */}
      <button
        onClick={() => { setPredActiveField(isOpen ? null : field); setPredSearch(""); }}
        className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors relative z-[46] ${
          value ? "border-cyan-500/40 bg-cyan-500/10 text-white" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
        }`}
      >
        {value ? (players.find(p => p.id === value)?.name ?? "Gekozen") : "Kies een speler..."}
      </button>

      {/* Floating dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-[47] mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-800">
            <input type="text" placeholder="Zoek op naam of elftal..." value={predSearch}
              onChange={(e) => setPredSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40" />
          </div>
          <div className="overflow-y-auto max-h-[352px]">
            {filteredPlayers.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Geen spelers gevonden</p>
            ) : filteredPlayers.map(p => (
              <button key={p.id}
                onClick={() => { onSelect(p.id); setPredActiveField(null); setPredSearch(""); }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-800 transition-colors flex items-center justify-between border-b border-slate-800/40 last:border-0 ${value === p.id ? "text-cyan-400" : "text-white"}`}>
                <span>{p.name}</span>
                <span className="text-slate-500 text-xs">{CLUB_LABEL[p.clubTeam] ?? p.clubTeam}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
