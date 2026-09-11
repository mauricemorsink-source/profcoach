import type { Player, SlotDef } from "@/components/team/types";
import { CLUB_LABEL } from "@/components/team/validate";
import { POSITION_LABEL } from "./constants";

export default function PlayerPickerModal({
  activeSlot, playerSearch, setPlayerSearch, modalPlayers, currentInSlot, chosenIds,
  handleSelectPlayer, handleClearSlot, onClose, showTour,
}: {
  activeSlot: SlotDef;
  playerSearch: string;
  setPlayerSearch: (value: string) => void;
  modalPlayers: Player[];
  currentInSlot: string | null;
  chosenIds: Set<string>;
  handleSelectPlayer: (playerId: string) => void;
  handleClearSlot: () => void;
  onClose: () => void;
  showTour: boolean;
}) {
  return (
    <div className={`fixed inset-0 bg-black/70 flex items-start justify-center pt-16 sm:pt-20 px-4 ${showTour ? "z-[94]" : "z-50"}`}>
      <div data-tour="tour-picker" className="bg-slate-900 neon-border w-full sm:max-w-md rounded-2xl max-h-[calc(85dvh-4rem)] sm:max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">{activeSlot.label}</p>
            <h3 className="font-bold text-white">Kies {POSITION_LABEL[activeSlot.position] ?? activeSlot.position}</h3>
          </div>
          <div className="flex items-center gap-2">
            {currentInSlot && (
              <button onClick={handleClearSlot} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-500/30 transition-colors">
                Leegmaken
              </button>
            )}
            <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center transition-colors">×</button>
          </div>
        </div>
        <div className="px-5 pt-3 pb-2">
          <input type="text" placeholder="Zoek op naam of elftal..." value={playerSearch} onChange={(e) => setPlayerSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
        </div>
        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-1.5">
          {playerSearch.trim() !== "" && (
            <p className="text-xs text-slate-500 pb-1">
              {modalPlayers.length === 0 ? "Geen spelers gevonden" : `${modalPlayers.length} speler${modalPlayers.length !== 1 ? "s" : ""} gevonden`}
            </p>
          )}
          {modalPlayers.length === 0
            ? <p className="text-slate-500 text-sm text-center py-8">Geen spelers gevonden.</p>
            : modalPlayers.map((player) => {
              const isInThisSlot = currentInSlot === player.id;
              const isElsewhere = chosenIds.has(player.id) && !isInThisSlot;
              return (
                <div key={player.id} onClick={() => handleSelectPlayer(player.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${isInThisSlot ? "border-cyan-500/50 bg-cyan-500/10" : isElsewhere ? "border-slate-800 bg-slate-800/30 opacity-50" : "border-slate-800 bg-slate-800/30 hover:border-cyan-500/40 hover:bg-slate-800"}`}>
                  <div>
                    <div className="font-semibold text-white text-sm">{player.name}</div>
                    <div className="text-xs text-slate-500">{CLUB_LABEL[player.clubTeam] ?? player.clubTeam}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-cyan-400 text-sm">€{player.value}</span>
                    {isInThisSlot && <span className="text-xs bg-cyan-900/40 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">Gekozen</span>}
                    {isElsewhere && <span className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-700">Elders</span>}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
