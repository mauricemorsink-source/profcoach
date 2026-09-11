import type { RefObject } from "react";
import type { Player, SlotDef } from "../types";
import type { ValidationResult } from "../validate";
import Pitch from "../Pitch";
import { BTN_PRIMARY, BTN_SECONDARY } from "./constants";

export default function Step1PlayerSelection({
  locked, readOnly, step,
  stepOneValidation, hasMismatch,
  slots, selectedSlot, playersById, slotValues, onSlotClick,
  captainEnabled, captainSlot,
  pitchRef,
  budget,
  saving, teamEntryId, onSave,
  teamValid, goNext,
}: {
  locked: boolean;
  readOnly: boolean;
  step: 1 | 2 | 3 | 4;
  stepOneValidation: ValidationResult;
  hasMismatch: boolean;
  slots: SlotDef[];
  selectedSlot: number | null;
  playersById: Record<string, Player>;
  slotValues: (string | null)[];
  onSlotClick: (slotIndex: number) => void;
  captainEnabled: boolean;
  captainSlot: number | null;
  pitchRef: RefObject<HTMLDivElement | null>;
  budget: number;
  saving: boolean;
  teamEntryId: string | null;
  onSave: () => void;
  teamValid: boolean;
  goNext: () => void;
}) {
  const v = stepOneValidation;
  const errors = v.rules
    .filter(r => !r.met)
    .map(r => {
      if (r.key === "positions") return "Eén of meer spelers staan op een verkeerde positie — pas de opstelling of formatie aan.";
      if (r.key === "spelers") return `Selecteer precies 11 spelers (nu ${v.selectedCount}).`;
      if (r.key === "budget") return `Budget overschreden: €${v.totalValue} van €${budget}.`;
      if (r.key.startsWith("club_")) {
        const club = r.key.replace("club_", "");
        const count = v.countsByClub[club] ?? 0;
        if (count < 1) return `Minimaal 1 speler vereist uit ${r.label}.`;
        if (count > 2) return `Maximaal 2 spelers uit ${r.label} (nu ${count}).`;
      }
      return null;
    })
    .filter(Boolean) as string[];

  return (
    <>
      {/* Regels checklist */}
      {!locked && !readOnly && step === 1 && (
        <div className={`mb-5 rounded-2xl border p-4 transition-colors ${v.allValid ? "bg-green-900/15 border-green-500/30" : "bg-red-900/15 border-red-500/20"}`}>
          {hasMismatch && (
            <div className="flex items-start gap-2 mb-3 bg-red-900/30 border border-red-500/40 rounded-xl px-3 py-2.5">
              <span className="text-red-400 text-base shrink-0 mt-0.5">⚠</span>
              <p className="text-red-300 text-xs font-medium">
                Eén of meer spelers staan op een verkeerde positie door een formatiewijziging. Pas de opstelling aan of kies een andere formatie.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
            {v.rules.map((rule) => (
              <div key={rule.key} className="flex items-center gap-1.5 text-xs">
                <span className={rule.met ? "text-green-400" : "text-red-400"}>{rule.met ? "✓" : "✗"}</span>
                <span className="text-slate-400 truncate">{rule.label}:</span>
                <span className={`font-bold shrink-0 ${rule.met ? "text-green-400" : "text-red-400"}`}>{rule.display}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div ref={pitchRef}>
        <Pitch slots={slots} selectedSlot={selectedSlot} playersById={playersById} slotValues={slotValues}
          onSlotClick={onSlotClick} locked={locked || readOnly || step !== 1} captainSlot={captainEnabled ? captainSlot : null} />
      </div>

      {!locked && !readOnly && step === 1 && (
        <div className="mt-4 space-y-3">
          {errors.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 space-y-1">
              {errors.map((e, i) => (
                <p key={i} className="text-red-400 text-xs flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">✗</span>
                  <span>{e}</span>
                </p>
              ))}
            </div>
          )}
          <div className="flex gap-3 flex-wrap">
            <button onClick={onSave} disabled={saving || !teamEntryId} className={BTN_SECONDARY}>
              {saving ? "Bezig..." : "Concept opslaan"}
            </button>
            <button onClick={goNext} disabled={!teamValid} className={BTN_PRIMARY + " ml-auto"}>
              Volgende stap →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
