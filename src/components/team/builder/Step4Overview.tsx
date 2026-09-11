import type { RefObject } from "react";
import type { Formation, Player, SlotDef } from "../types";
import { CLUB_LABEL } from "../validate";
import Pitch from "../Pitch";
import { BTN_PRIMARY, BTN_SECONDARY, POSITION_LABEL, POS_ORDER } from "./constants";

export default function Step4Overview({
  pitchRef, slots, playersById, slotValues, captainEnabled, captainSlot,
  formation,
  players, predTopScorerId, predAssistKoningId, predYellowCards, predTotalGoals,
  goPrev, onDownloadImage, downloading, onFinalSubmit, saving,
}: {
  pitchRef: RefObject<HTMLDivElement | null>;
  slots: SlotDef[];
  playersById: Record<string, Player>;
  slotValues: (string | null)[];
  captainEnabled: boolean;
  captainSlot: number | null;
  formation: Formation | undefined;
  players: Player[];
  predTopScorerId: string | null;
  predAssistKoningId: string | null;
  predYellowCards: string;
  predTotalGoals: string;
  goPrev: () => void;
  onDownloadImage: () => void;
  downloading: boolean;
  onFinalSubmit: () => void;
  saving: boolean;
}) {
  return (
    <>
      <div ref={pitchRef}>
        <Pitch slots={slots} selectedSlot={null} playersById={playersById} slotValues={slotValues}
          onSlotClick={() => {}} locked captainSlot={captainEnabled ? captainSlot : null} />
      </div>

      <div className="bg-slate-900 neon-border rounded-2xl p-5 space-y-5 mt-4">
        <div>
          <p className="text-base font-bold text-white mb-0.5">Controleer je inschrijving</p>
          <p className="text-slate-500 text-xs">Kijk alles na en dien je team in. Dit kan daarna niet meer worden gewijzigd.</p>
        </div>

        {/* Team overzicht */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Jouw team</p>
            <span className="text-xs text-slate-600">{formation?.code}</span>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <thead>
              <tr className="text-left text-slate-600 border-b border-slate-800">
                <th className="pb-1.5 font-semibold">Naam</th>
                <th className="pb-1.5 font-semibold">Pos.</th>
                <th className="pb-1.5 font-semibold">Elftal</th>
              </tr>
            </thead>
            <tbody>
              {slots
                .filter(s => slotValues[s.slotIndex])
                .sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position))
                .map(s => {
                  const player = playersById[slotValues[s.slotIndex]!];
                  if (!player) return null;
                  const isCaptain = captainEnabled && captainSlot === s.slotIndex;
                  return (
                    <tr key={s.slotIndex} className="border-b border-slate-800/40">
                      <td className="py-1.5 text-slate-200">
                        {player.name}
                        {isCaptain && <span className="ml-1.5 text-amber-400 font-bold text-xs">C</span>}
                      </td>
                      <td className="py-1.5 text-slate-500 text-xs">{POSITION_LABEL[s.position] ?? s.position}</td>
                      <td className="py-1.5 text-slate-500 text-xs">{CLUB_LABEL[player.clubTeam] ?? player.clubTeam}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Voorspellingen */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Voorspellingen</p>
          <div className="space-y-1.5">
            {[
              { label: "Topscorer", value: predTopScorerId ? (players.find(p => p.id === predTopScorerId)?.name ?? "—") : "—" },
              { label: "Assistkoning", value: predAssistKoningId ? (players.find(p => p.id === predAssistKoningId)?.name ?? "—") : "—" },
              { label: "Gele kaarten", value: predYellowCards !== "" ? predYellowCards : "—" },
              { label: "Totaal doelpunten", value: predTotalGoals !== "" ? predTotalGoals : "—" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{row.label}</span>
                <span className={`font-medium ${row.value === "—" ? "text-slate-600" : "text-white"}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4 flex-wrap">
        <button onClick={goPrev} className={BTN_SECONDARY}>← Vorige</button>
        <button onClick={onDownloadImage} disabled={downloading} className={BTN_SECONDARY}>
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="shrink-0">
              <path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {downloading ? "Laden..." : "Download opstelling"}
          </span>
        </button>
        <button onClick={onFinalSubmit} disabled={saving} className={BTN_PRIMARY + " ml-auto"}>
          {saving ? "Bezig..." : "Team indienen"}
        </button>
      </div>
    </>
  );
}
