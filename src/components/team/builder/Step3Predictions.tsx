import type { Player } from "../types";
import { BTN_PRIMARY, BTN_SECONDARY } from "./constants";
import PredPlayerPicker from "./PredPlayerPicker";

export default function Step3Predictions({
  predPointsConfig, players,
  predTopScorerId, setPredTopScorerId, predAssistKoningId, setPredAssistKoningId,
  predActiveField, setPredActiveField, predSearch, setPredSearch,
  predYellowCards, setPredYellowCards, predTotalGoals, setPredTotalGoals,
  goPrev, goNext,
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
  goPrev: () => void;
  goNext: () => void;
}) {
  return (
    <>
      <div className="bg-slate-900 neon-border rounded-2xl p-5 space-y-5">
        <div>
          <p className="text-base font-bold text-white mb-1">Bonusvoorspellingen</p>
          <p className="text-slate-400 text-sm">Vul jouw voorspellingen in voor bonuspunten aan het einde van het seizoen. Dit kan na het indienen niet meer worden gewijzigd.</p>
          <p className="text-slate-500 text-xs mt-1">De topscorer en assistkoning hoeven niet in jouw eigen team te zitten — je kiest uit alle spelers in het spel.</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
            Topscorer {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.topScorerPoints} pt)</span>}
          </label>
          <PredPlayerPicker field="topscorer" value={predTopScorerId} onSelect={setPredTopScorerId} players={players} predActiveField={predActiveField} setPredActiveField={setPredActiveField} predSearch={predSearch} setPredSearch={setPredSearch} />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
            Assistkoning {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.assistKoningPoints} pt)</span>}
          </label>
          <PredPlayerPicker field="assistkoning" value={predAssistKoningId} onSelect={setPredAssistKoningId} players={players} predActiveField={predActiveField} setPredActiveField={setPredActiveField} predSearch={predSearch} setPredSearch={setPredSearch} />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
            Totaal gele kaarten VV Rietmolen (dit seizoen) {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.yellowCardsPoints} pt)</span>}
          </label>
          <p className="text-xs text-slate-600 mb-1.5">Enkel gele kaarten voor spelers van VV Rietmolen. Gele kaarten van de tegenstander tellen niet mee.</p>
          <input type="number" min="0" value={predYellowCards} onChange={(e) => setPredYellowCards(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
            Totaal doelpunten VV Rietmolen (dit seizoen) {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.totalGoalsPoints} pt)</span>}
          </label>
          <p className="text-xs text-slate-600 mb-1.5">Incl. eigen goals tegenstanders en spelers buiten het spel (jeugdspelers, nieuwe spelers etc.)</p>
          <input type="number" min="0" value={predTotalGoals} onChange={(e) => setPredTotalGoals(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={goPrev} className={BTN_SECONDARY}>← Vorige</button>
        <button onClick={goNext} className={BTN_PRIMARY + " ml-auto"}>Bekijk overzicht →</button>
      </div>
    </>
  );
}
