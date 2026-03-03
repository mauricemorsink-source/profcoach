"use client";

import type { SlotDef, Player } from "./types";

// Compacte labels voor het veld — Dames wordt getoond als VR1
const PITCH_CLUB_LABEL: Record<string, string> = {
  ONE:   "Rietmolen 1",
  TWO:   "Rietmolen 2",
  THREE: "Rietmolen 3",
  FOUR:  "Rietmolen 4",
  FIVE:  "Rietmolen 5",
  DAMES: "VR1",
};

// Splits "Voornaam Achternaam" in twee regels
function splitName(name: string): [string, string | null] {
  const idx = name.indexOf(" ");
  if (idx === -1) return [name, null];
  return [name.slice(0, idx), name.slice(idx + 1)];
}

interface PitchProps {
  slots: SlotDef[];
  selectedSlot: number | null;
  playersById: Record<string, Player>;
  slotValues: (string | null)[];
  onSlotClick: (slotIndex: number) => void;
  locked: boolean;
}

function SlotCard({
  slot,
  player,
  isActive,
  onClick,
  locked,
}: {
  slot: SlotDef;
  player: Player | null;
  isActive: boolean;
  onClick: () => void;
  locked: boolean;
}) {
  const displayName = player ? (player.shortName ?? player.name) : "";
  const [nameLine1, nameLine2] = splitName(displayName);
  const mismatch = player !== null && player.position !== slot.position;

  return (
    <div
      onClick={locked ? undefined : onClick}
      className={`
        relative rounded-xl border-2 text-center px-2 py-2 w-[100px] h-[96px] overflow-hidden transition-all select-none
        ${locked
          ? "cursor-default opacity-70 border-white/20 bg-black/30"
          : isActive
          ? "border-cyan-400 bg-cyan-500/20 scale-105 cursor-pointer shadow-lg"
          : mismatch
          ? "border-red-500/80 bg-red-900/30 cursor-pointer hover:bg-red-900/40"
          : player
          ? "border-white/40 bg-black/40 cursor-pointer hover:border-cyan-400/60 hover:bg-black/50 hover:scale-105"
          : "border-white/20 bg-black/20 cursor-pointer hover:border-cyan-400/50 hover:bg-black/30 hover:scale-105"
        }
      `}
      style={isActive ? { boxShadow: "0 0 16px rgba(34,211,238,0.4)" } : mismatch ? { boxShadow: "0 0 10px rgba(239,68,68,0.35)" } : undefined}
    >
      <div className="text-[10px] font-bold text-white/50 mb-0.5">{slot.label}</div>
      {player ? (
        <>
          <div className="text-[11px] font-bold text-white leading-tight">{nameLine1}</div>
          {nameLine2 && (
            <div className="text-[11px] font-bold text-white leading-tight truncate">{nameLine2}</div>
          )}
          <div className="text-[10px] text-white/50 mt-0.5 truncate">{PITCH_CLUB_LABEL[player.clubTeam] ?? player.clubTeam}</div>
          <div className={`text-[11px] font-bold mt-0.5 ${mismatch ? "text-red-400" : "text-cyan-400"}`}>€{player.value}</div>
          {mismatch && (
            <div className="text-[9px] text-red-400 font-semibold leading-none mt-0.5">verkeerde positie</div>
          )}
        </>
      ) : (
        <div className="text-[10px] text-white/30 italic mt-2">Kies speler</div>
      )}
      {!locked && !player && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-white/60 text-lg">+</span>
        </div>
      )}
    </div>
  );
}

export default function Pitch({
  slots,
  selectedSlot,
  playersById,
  slotValues,
  onSlotClick,
  locked,
}: PitchProps) {
  const positions = ["GK", "DEF", "MID", "ATT"] as const;
  const rows = positions
    .map((pos) => slots.filter((s) => s.position === pos))
    .filter((row) => row.length > 0);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0d3d1a 0%, #145c26 40%, #145c26 60%, #0d3d1a 100%)",
        minHeight: 460,
        boxShadow: "0 0 30px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.2)",
      }}
    >
      {/* Veld lijnen */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.15 }}>
        <div className="absolute left-0 right-0 border-t-2 border-white" style={{ top: "50%" }} />
        <div className="absolute border-2 border-white rounded-full w-24 h-24"
          style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <div className="absolute w-2 h-2 bg-white rounded-full"
          style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <div className="absolute border-2 border-white"
          style={{ top: 0, left: "20%", right: "20%", height: "16%" }} />
        <div className="absolute border-2 border-white"
          style={{ bottom: 0, left: "20%", right: "20%", height: "16%" }} />
        <div className="absolute border-2 border-white"
          style={{ top: 0, left: "35%", right: "35%", height: "7%" }} />
        <div className="absolute border-2 border-white"
          style={{ bottom: 0, left: "35%", right: "35%", height: "7%" }} />
        <div className="absolute inset-3 border-2 border-white rounded-sm" />
      </div>

      {/* Spelers (ATT bovenaan, GK onderaan — aanvalsveld-perspectief) */}
      <div className="relative z-10 flex flex-col-reverse justify-around h-full py-5 gap-2" style={{ minHeight: 460 }}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-3 flex-wrap px-4">
            {row.map((slot) => (
              <SlotCard
                key={slot.slotIndex}
                slot={slot}
                player={slotValues[slot.slotIndex] ? playersById[slotValues[slot.slotIndex]!] ?? null : null}
                isActive={selectedSlot === slot.slotIndex}
                onClick={() => onSlotClick(slot.slotIndex)}
                locked={locked}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
