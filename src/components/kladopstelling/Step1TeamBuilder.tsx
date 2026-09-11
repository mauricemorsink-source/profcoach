import type { Player, SlotDef } from "@/components/team/types";
import type { ValidationResult } from "@/components/team/validate";
import Pitch from "@/components/team/Pitch";
import RegistrationClosedNotice from "@/components/RegistrationClosedNotice";
import { BTN_PRIMARY } from "./constants";

export default function Step1TeamBuilder({
  stepOneValidation, hasMismatch, slots, selectedSlot, playersById, slotValues, onSlotClick,
  canSubmitPublic, teamValid, goNext, registrationClosed, registrationClosedTitle, registrationClosedText,
}: {
  stepOneValidation: ValidationResult;
  hasMismatch: boolean;
  slots: SlotDef[];
  selectedSlot: number | null;
  playersById: Record<string, Player>;
  slotValues: (string | null)[];
  onSlotClick: (slotIndex: number) => void;
  canSubmitPublic: boolean;
  teamValid: boolean;
  goNext: () => void;
  registrationClosed: boolean;
  registrationClosedTitle?: string;
  registrationClosedText?: string;
}) {
  return (
    <>
      {/* Validatie checklist */}
      <div className="mb-5">
        <div data-tour="tour-validation" className={`rounded-2xl border p-4 transition-colors ${stepOneValidation.allValid ? "bg-green-900/15 border-green-500/30" : "bg-red-900/15 border-red-500/20"}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
            {stepOneValidation.rules.map((rule) => (
              <div key={rule.key} className="flex items-center gap-1.5 text-xs">
                <span className={rule.met ? "text-green-400" : "text-red-400"}>{rule.met ? "✓" : "✗"}</span>
                <span className="text-slate-400 truncate">{rule.label}:</span>
                <span className={`font-bold shrink-0 ${rule.met ? "text-green-400" : "text-red-400"}`}>{rule.display}</span>
              </div>
            ))}
          </div>
        </div>
        {hasMismatch && (
          <div className="flex items-start gap-2 mt-3 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3">
            <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
            <p className="text-red-300 text-sm">Doordat je de formatie hebt gewijzigd, staan één of meerdere spelers op een onjuiste positie. Klik op de speler op het veld om hem te vervangen.</p>
          </div>
        )}
      </div>

      <div data-tour="tour-pitch">
        <Pitch
          slots={slots}
          selectedSlot={selectedSlot}
          playersById={playersById}
          slotValues={slotValues}
          onSlotClick={onSlotClick}
          locked={false}
          captainSlot={null}
        />
      </div>

      <div className="mt-4 flex gap-3 flex-wrap">
        {canSubmitPublic ? (
          <button data-tour="tour-next" onClick={goNext} disabled={!teamValid} className={BTN_PRIMARY + " ml-auto"}>
            Volgende stap →
          </button>
        ) : registrationClosed ? (
          <div className="mt-4 w-full">
            <RegistrationClosedNotice title={registrationClosedTitle} text={registrationClosedText} />
          </div>
        ) : (
          <div className="mt-4 w-full bg-cyan-900/20 border border-cyan-500/30 rounded-2xl px-5 py-5">
            <p className="text-white font-bold text-sm mb-1">Tevreden met je opstelling?</p>
            <p className="text-slate-400 text-sm">
              Dien je echte team in via <span className="text-cyan-400 font-medium">Mijn team</span> — daar kun je je opstelling officieel inschrijven voor het spel.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
