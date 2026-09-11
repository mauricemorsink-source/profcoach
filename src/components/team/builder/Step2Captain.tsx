import type { Player, SlotDef } from "../types";
import { BTN_PRIMARY, BTN_SECONDARY, POSITION_LABEL } from "./constants";

export default function Step2Captain({
  selectedPlayers, playersById, captainSlot, setCaptainSlot, captainBonusPerWin, goPrev, goNext,
}: {
  selectedPlayers: { slot: SlotDef; playerId: string }[];
  playersById: Record<string, Player>;
  captainSlot: number | null;
  setCaptainSlot: (slot: number | null) => void;
  captainBonusPerWin: number;
  goPrev: () => void;
  goNext: () => void;
}) {
  return (
    <>
      <div className="bg-slate-900 neon-border rounded-2xl p-5">
        <p className="text-base font-bold text-white mb-1">Kies je aanvoerder</p>
        <p className="text-slate-400 text-sm mb-5">
          Kies je aanvoerder van jouw team en maak kans op extra punten gedurende het seizoen: jouw aanvoerder ontvangt dit seizoen voor iedere overwinning <span className="text-amber-400 font-bold">{captainBonusPerWin} extra punten</span>!
        </p>
        <div className="space-y-2">
          {selectedPlayers.map(({ slot, playerId }) => {
            const player = playersById[playerId];
            if (!player) return null;
            const isCaptain = captainSlot === slot.slotIndex;
            return (
              <button key={playerId} onClick={() => setCaptainSlot(isCaptain ? null : slot.slotIndex)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${
                  isCaptain
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-400"
                }`}>
                <div className="flex items-center gap-3">
                  {isCaptain
                    ? <span className="w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center text-xs font-black text-amber-400">C</span>
                    : <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-500">C</span>
                  }
                  <span>{player.name}</span>
                </div>
                <span className="text-xs text-slate-500">{POSITION_LABEL[player.position] ?? player.position}</span>
              </button>
            );
          })}
        </div>
        {captainSlot === null && <p className="text-xs text-amber-400/70 mt-3">Nog geen aanvoerder gekozen — kies een speler hierboven</p>}
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={goPrev} className={BTN_SECONDARY}>← Vorige</button>
        <button onClick={goNext} className={BTN_PRIMARY + " ml-auto"}>Volgende stap →</button>
      </div>
    </>
  );
}
