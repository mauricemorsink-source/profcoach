"use client";

import type { Player, SlotDef } from "./types";

const POSITION_LABEL: Record<string, string> = { GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN" };
const POSITION_COLOR: Record<string, string> = {
  GK:  "text-amber-600 bg-amber-100 border-amber-300",
  DEF: "text-blue-600 bg-blue-100 border-blue-300",
  MID: "text-green-600 bg-green-100 border-green-300",
  ATT: "text-red-600 bg-red-100 border-red-300",
};

interface PlayerPickerProps {
  players: Player[];
  activeSlot: SlotDef | null;
  slotValues: (string | null)[];
  onSelectPlayer: (playerId: string) => void;
  onClearSlot: () => void;
  locked: boolean;
}

export default function PlayerPicker({
  players,
  activeSlot,
  slotValues,
  onSelectPlayer,
  onClearSlot,
  locked,
}: PlayerPickerProps) {
  if (!activeSlot) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 italic">
        Klik op een slot om een speler te kiezen
      </div>
    );
  }

  const filtered = players.filter((p) => p.position === activeSlot.position);
  const chosenIds = new Set(slotValues.filter(Boolean));
  const currentInSlot = slotValues[activeSlot.slotIndex];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-700">
          Kies een {activeSlot.position} voor {activeSlot.label}
        </h3>
        {!locked && (
          <button
            onClick={onClearSlot}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            Slot leegmaken
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {filtered.map((player) => {
          const isChosen = chosenIds.has(player.id);
          const isInThisSlot = currentInSlot === player.id;

          return (
            <div
              key={player.id}
              onClick={locked ? undefined : () => onSelectPlayer(player.id)}
              className={`
                flex items-center justify-between p-3 rounded-lg border-2 transition-all
                ${isInThisSlot ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-white"}
                ${isChosen && !isInThisSlot ? "opacity-50" : ""}
                ${locked ? "cursor-default" : "cursor-pointer hover:border-green-400 hover:bg-green-50"}
              `}
            >
              <div>
                <div className="font-semibold text-gray-800">{player.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${POSITION_COLOR[player.position] ?? "text-gray-500 bg-gray-100 border-gray-300"}`}>
                    {POSITION_LABEL[player.position] ?? player.position}
                  </span>
                  <span className="text-sm text-gray-500">{player.clubTeam}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-bold text-green-600">€{player.value}</span>
                {isInThisSlot && (
                  <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">
                    Gekozen
                  </span>
                )}
                {isChosen && !isInThisSlot && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    Elders
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}