"use client";

import { useEffect, useRef } from "react";
import type { AllPlayer } from "./types";
import { CLUB_LABEL, POSITION_LABEL } from "./constants";

// Sub-component: guest player picker
export default function GuestPicker({
  allPlayers,
  managedTeam,
  search,
  onSearchChange,
  onAdd,
  onClose,
  existingIds,
}: {
  allPlayers: AllPlayer[];
  managedTeam: string;
  search: string;
  onSearchChange: (v: string) => void;
  onAdd: (player: AllPlayer) => void;
  onClose: () => void;
  existingIds: Set<string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const candidates = allPlayers.filter(
    (p) =>
      // eigen team-spelers zonder altTeam staan al in de gewone lijst → uitsluiten
      // FLEX spelers van eigen team (clubTeam===managedTeam maar altTeam!==null) → wél tonen
      // FLEX spelers die al naar dit team zijn overgezet (altTeam===managedTeam) → uitsluiten
      !(p.clubTeam === managedTeam && p.altTeam === null) &&
      p.altTeam !== managedTeam &&
      !existingIds.has(p.id) &&
      (search.length < 2 ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (CLUB_LABEL[p.clubTeam] ?? p.clubTeam).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="mt-3 bg-slate-800 border border-amber-500/30 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-amber-400">Gastspeler toevoegen</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-sm transition-colors">✕</button>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Zoek op naam of elftal..."
        className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 mb-2"
      />
      {search.length < 2 ? (
        <p className="text-slate-500 text-xs text-center py-2">Typ minimaal 2 tekens om te zoeken</p>
      ) : candidates.length === 0 ? (
        <p className="text-slate-500 text-xs text-center py-2">Geen spelers gevonden</p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {candidates.map((p) => (
            <button
              key={p.id}
              onClick={() => { onAdd(p); onSearchChange(""); }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left hover:bg-slate-700 transition-colors group"
            >
              <span className="text-sm text-white">{p.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{CLUB_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                <span className="text-xs text-slate-500">{POSITION_LABEL[p.position]}</span>
                <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">+ toevoegen</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
