import type { Player } from "../types";
import { BTN_PRIMARY, BTN_SECONDARY } from "./constants";
import PredPlayerPicker from "./PredPlayerPicker";

export default function PredictionModal({
  predPointsConfig, players,
  predTopScorerId, setPredTopScorerId, predAssistKoningId, setPredAssistKoningId,
  predActiveField, setPredActiveField, predSearch, setPredSearch,
  predYellowCards, setPredYellowCards, predTotalGoals, setPredTotalGoals,
  predSaving, onClose, onSkip, onSubmit,
}: {
  predPointsConfig: { showPointsToParticipants: boolean; topScorerPoints: number; assistKoningPoints: number; yellowCardsPoints: number; totalGoalsPoints: number } | null;
  players: Player[];
  predTopScorerId: string | null;
  setPredTopScorerId: (id: string) => void;
  predAssistKoningId: string | null;
  setPredAssistKoningId: (id: string) => void;
  predActiveField: "topscorer" | "assistkoning" | null;
  setPredActiveField: (field: "topscorer" | "assistkoning" | null) => void;
  predSearch: string;
  setPredSearch: (value: string) => void;
  predYellowCards: string;
  setPredYellowCards: (value: string) => void;
  predTotalGoals: string;
  setPredTotalGoals: (value: string) => void;
  predSaving: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 neon-border w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Bonusvraag</p>
            <h3 className="font-bold text-white">Jouw voorspellingen</h3>
          </div>
          <button onClick={onClose}
            className="text-slate-500 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center transition-colors">×</button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          <p className="text-slate-400 text-sm">Dit kan na het indienen van je team niet meer worden gewijzigd.</p>
          <p className="text-slate-500 text-xs">De topscorer en assistkoning hoeven niet in jouw eigen team te zitten — je kiest uit alle spelers in het spel.</p>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Topscorer {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.topScorerPoints} pt)</span>}</label>
            <PredPlayerPicker field="topscorer" value={predTopScorerId} onSelect={setPredTopScorerId} players={players} predActiveField={predActiveField} setPredActiveField={setPredActiveField} predSearch={predSearch} setPredSearch={setPredSearch} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Assistkoning {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.assistKoningPoints} pt)</span>}</label>
            <PredPlayerPicker field="assistkoning" value={predAssistKoningId} onSelect={setPredAssistKoningId} players={players} predActiveField={predActiveField} setPredActiveField={setPredActiveField} predSearch={predSearch} setPredSearch={setPredSearch} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Totaal gele kaarten VV Rietmolen (dit seizoen) {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.yellowCardsPoints} pt)</span>}</label>
            <p className="text-xs text-slate-600 mb-1.5">Enkel gele kaarten voor spelers van VV Rietmolen. Gele kaarten van de tegenstander tellen niet mee.</p>
            <input type="number" min="0" value={predYellowCards} onChange={(e) => setPredYellowCards(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Totaal doelpunten VV Rietmolen (dit seizoen) {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.totalGoalsPoints} pt)</span>}</label>
            <p className="text-xs text-slate-600 mb-1.5">Incl. eigen goals tegenstanders en spelers buiten het spel (jeugdspelers, nieuwe spelers etc.)</p>
            <input type="number" min="0" value={predTotalGoals} onChange={(e) => setPredTotalGoals(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
          </div>
        </div>
        <div className="px-5 pb-5 pt-3 shrink-0 border-t border-slate-800 flex gap-3">
          <button onClick={onSkip} className={BTN_SECONDARY}>Overslaan</button>
          <button onClick={onSubmit} disabled={predSaving || (!predTopScorerId && !predAssistKoningId && predYellowCards === "" && predTotalGoals === "")} className={BTN_PRIMARY + " flex-1"}>
            {predSaving ? "Opslaan..." : "Voorspellingen indienen"}
          </button>
        </div>
      </div>
    </div>
  );
}
