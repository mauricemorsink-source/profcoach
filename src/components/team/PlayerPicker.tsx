"use client";

import type { Player, SlotDef } from "./types";

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
                <div className="text-sm text-gray-500">{player.clubTeam} · {player.position}</div>
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