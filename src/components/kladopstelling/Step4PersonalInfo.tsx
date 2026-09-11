import type { PersonInfo } from "./types";
import { BTN_PRIMARY, BTN_SECONDARY, INPUT } from "./constants";

export default function Step4PersonalInfo({
  personInfo, setPersonInfo, inschrijfgeld, inschrijfgeldDisplay,
  betaaldAkkoord, setBetaaldAkkoord, submitError, submitting, goPrev, handleSubmit,
}: {
  personInfo: PersonInfo;
  setPersonInfo: (info: PersonInfo) => void;
  inschrijfgeld: number;
  inschrijfgeldDisplay: string;
  betaaldAkkoord: boolean;
  setBetaaldAkkoord: (value: boolean) => void;
  submitError: string | null;
  submitting: boolean;
  goPrev: () => void;
  handleSubmit: () => void;
}) {
  return (
    <>
      <div className="bg-slate-900 neon-border rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-base font-bold text-white mb-1">Jouw gegevens</p>
          <p className="text-slate-400 text-sm">Vul je gegevens in om de inschrijving te voltooien. Er wordt geen account aangemaakt.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Voornaam *</label>
            <input type="text" value={personInfo.voornaam} onChange={(e) => setPersonInfo({ ...personInfo, voornaam: e.target.value })} className={INPUT} placeholder="Jan" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Achternaam *</label>
            <input type="text" value={personInfo.achternaam} onChange={(e) => setPersonInfo({ ...personInfo, achternaam: e.target.value })} className={INPUT} placeholder="Janssen" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Mailadres *</label>
          <input type="email" value={personInfo.email} onChange={(e) => setPersonInfo({ ...personInfo, email: e.target.value })} className={INPUT} placeholder="jan@voorbeeld.nl" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Telefoonnummer *</label>
          <input type="tel" value={personInfo.telefoonnummer} onChange={(e) => setPersonInfo({ ...personInfo, telefoonnummer: e.target.value })} className={INPUT} placeholder="06 12345678" />
          <p className="text-xs text-slate-500 mt-1.5">
            Het inschrijfgeld wordt via een Tikkie betaald. Voer je nummer in zodat we je dat kunnen sturen.
          </p>
        </div>
        <div className="flex items-start gap-3 bg-slate-800/50 rounded-xl border border-slate-700 px-4 py-3">
          <input type="checkbox" id="whatsapp" checked={personInfo.whatsappGroep} onChange={(e) => setPersonInfo({ ...personInfo, whatsappGroep: e.target.checked })} className="mt-0.5 w-4 h-4 accent-cyan-500 shrink-0" />
          <label htmlFor="whatsapp" className="text-sm text-slate-300 cursor-pointer">
            Voeg me toe aan de ProfCoach WhatsApp-groep voor updates over de tussenstand
          </label>
        </div>

        {inschrijfgeld > 0 && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl px-4 py-3">
            <p className="text-sm font-bold text-amber-300 mb-1">Inschrijfgeld</p>
            <p className="text-xs text-slate-400">
              Na het indienen ontvang je een Tikkie op je telefoonnummer voor het inschrijfgeld van €{inschrijfgeldDisplay}.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Ben je onder de 18 jaar? Dan is het inschrijfgeld €7,50.
            </p>
          </div>
        )}

        <div className="flex items-start gap-3 bg-slate-800/50 rounded-xl border border-slate-700 px-4 py-3">
          <input type="checkbox" id="akkoord" checked={betaaldAkkoord} onChange={(e) => setBetaaldAkkoord(e.target.checked)} className="mt-0.5 w-4 h-4 accent-cyan-500 shrink-0" />
          <label htmlFor="akkoord" className="text-sm text-slate-300 cursor-pointer">
            {inschrijfgeld > 0
              ? "Ik ga akkoord met het inschrijfgeld dat via een Tikkie wordt betaald"
              : "Ik ga akkoord met de spelregels en dien mijn team definitief in"}
          </label>
        </div>

        {submitError && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 px-3 py-2 rounded-lg">
            {submitError}
          </p>
        )}
      </div>

      <div className="flex gap-3 mt-4 flex-wrap">
        <button onClick={goPrev} disabled={submitting} className={BTN_SECONDARY}>← Vorige</button>
        <button onClick={handleSubmit} disabled={submitting || !betaaldAkkoord} className={BTN_PRIMARY + " ml-auto"}>
          {submitting ? "Bezig..." : "Team indienen"}
        </button>
      </div>
    </>
  );
}
