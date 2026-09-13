import type { Deelnemer } from "./types";
import { POSITION_SHORT, TEAM_LABEL, INPUT, LABEL, BTN_PRIMARY, BTN_SECONDARY, BTN_SMALL } from "./constants";

type FormState = {
  voornaam: string;
  achternaam: string;
  email: string;
  telefoonnummer: string;
  whatsappGroep: boolean;
  bonusPoints: string;
};

type Props = {
  modal: Deelnemer;
  form: FormState;
  setForm: (form: FormState) => void;
  saving: boolean;
  saveError: string;
  saveMsg: string;
  deleteConfirm: boolean;
  setDeleteConfirm: (v: boolean) => void;
  deleting: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onToggleBetaald: (d: Deelnemer) => void;
  onToggleWhatsappToegevoegd: (d: Deelnemer) => void;
  onOpenTeamEdit: () => void;
};

export default function DeelnemerDetailModal({
  modal,
  form,
  setForm,
  saving,
  saveError,
  saveMsg,
  deleteConfirm,
  setDeleteConfirm,
  deleting,
  onClose,
  onSave,
  onDelete,
  onToggleBetaald,
  onToggleWhatsappToegevoegd,
  onOpenTeamEdit,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              {modal.voornaam || modal.achternaam
                ? `${modal.voornaam ?? ""} ${modal.achternaam ?? ""}`.trim()
                : "Deelnemer"}
            </h3>
            <p className="text-xs text-slate-500">{new Date(modal.createdAt).toLocaleString("nl-NL")}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
        </div>

        {/* Team */}
        <div className="mb-5 pb-5 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Team</p>
            <button onClick={onOpenTeamEdit} className={BTN_SMALL}>Team bewerken</button>
          </div>
          {modal.players.length === 0 ? (
            <p className="text-slate-500 text-sm">Geen spelers.</p>
          ) : (
            <>
              {modal.formation && (
                <span className="text-xs bg-cyan-900/30 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-semibold mb-2 inline-block">{modal.formation.code}</span>
              )}
              <div className="overflow-x-auto">
              <table className="w-full text-xs mt-1 min-w-[360px]">
                <thead>
                  <tr className="text-left text-slate-600 border-b border-slate-800">
                    <th className="pb-1 font-semibold">Naam</th>
                    <th className="pb-1 font-semibold">Pos</th>
                    <th className="pb-1 font-semibold">Elftal</th>
                    <th className="pb-1 font-semibold text-right">Punten</th>
                    <th className="pb-1 font-semibold text-right">Aanvoerdersbonus</th>
                  </tr>
                </thead>
                <tbody>
                  {modal.players.map((tp) => {
                    const isCaptain = modal.captainSlot === tp.slotIndex;
                    return (
                      <tr key={tp.slotIndex} className="border-b border-slate-800/40">
                        <td className="py-1 text-slate-300">
                          {tp.player.name}
                          {isCaptain && <span className="ml-1 text-yellow-400 font-bold">C</span>}
                        </td>
                        <td className="py-1 text-slate-500">{POSITION_SHORT[tp.player.position] ?? tp.player.position}</td>
                        <td className="py-1 text-slate-500">{TEAM_LABEL[tp.player.clubTeam] ?? tp.player.clubTeam}</td>
                        <td className="py-1 text-right text-cyan-400 font-semibold">{tp.totalPoints}</td>
                        <td className="py-1 text-right">
                          {isCaptain
                            ? <span className="text-yellow-400 font-semibold">+{modal.captainPoints}</span>
                            : <span className="text-slate-700">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-800 font-semibold">
                    <td className="pt-1.5 text-slate-400" colSpan={3}>Totaal</td>
                    <td className="pt-1.5 text-right text-cyan-400">
                      {modal.players.reduce((s, tp) => s + tp.totalPoints, 0)}
                    </td>
                    <td className="pt-1.5 text-right text-yellow-400">
                      {modal.captainPoints > 0 ? `+${modal.captainPoints}` : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </>
          )}
        </div>

        {/* Voorspellingen */}
        {modal.prediction && (
          <div className="mb-5 pb-5 border-b border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Voorspellingen</p>
            <div className="space-y-1.5 text-sm">
              {[
                ["Topscorer", modal.prediction.topScorer?.name, modal.predictionBonusBreakdown?.topScorer],
                ["Assistkoning", modal.prediction.assistKoning?.name, modal.predictionBonusBreakdown?.assistKoning],
                ["Gele kaarten", modal.prediction.totalYellowCards, modal.predictionBonusBreakdown?.yellowCards],
                ["Totaal doelpunten", modal.prediction.totalGoals, modal.predictionBonusBreakdown?.totalGoals],
              ].map(([label, value, points]) => (
                <div key={String(label)} className="flex justify-between items-center">
                  <span className="text-slate-500">{label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-white font-medium">{value ?? <span className="text-slate-600 italic">—</span>}</span>
                    {modal.predictionBonusBreakdown && (
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${
                          points ? "bg-green-900/40 text-green-400 border-green-500/30" : "bg-slate-800 text-slate-500 border-slate-700"
                        }`}
                      >
                        {points ? `+${points}` : "0"}
                      </span>
                    )}
                  </span>
                </div>
              ))}
              {!modal.predictionBonusBreakdown && (
                <p className="text-xs text-slate-600 italic pt-1">
                  Nog niet verwerkt — punten per antwoord verschijnen hier zodra de bonuspunten zijn toegekend bij Spelinstellingen.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Persoonsgegevens bewerken */}
        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Persoonsgegevens</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Voornaam</label>
              <input type="text" value={form.voornaam} onChange={(e) => setForm({ ...form, voornaam: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Achternaam</label>
              <input type="text" value={form.achternaam} onChange={(e) => setForm({ ...form, achternaam: e.target.value })} className={INPUT} />
            </div>
          </div>
          <div>
            <label className={LABEL}>E-mailadres</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Telefoonnummer</label>
            <input type="text" value={form.telefoonnummer} onChange={(e) => setForm({ ...form, telefoonnummer: e.target.value })} className={INPUT} />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={() => onToggleBetaald(modal)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${modal.betaald ? "bg-green-500" : "bg-slate-600"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${modal.betaald ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <div>
              <span className="text-sm font-medium text-slate-300">Betaald</span>
              <p className="text-xs text-slate-500">
                {modal.betaald ? "Deelnamekosten ontvangen" : "Deelnamekosten nog niet ontvangen"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setForm({ ...form, whatsappGroep: !form.whatsappGroep })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${form.whatsappGroep ? "bg-green-500" : "bg-slate-600"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.whatsappGroep ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <div>
              <span className="text-sm font-medium text-slate-300">WhatsApp-groep</span>
              <p className="text-xs text-slate-500">
                {form.whatsappGroep ? "Wil toegevoegd worden aan de WhatsApp-groep" : "Wil niet toegevoegd worden aan de WhatsApp-groep"}
              </p>
            </div>
          </div>

          {form.whatsappGroep && (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => onToggleWhatsappToegevoegd(modal)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${modal.whatsappToegevoegd ? "bg-green-500" : "bg-slate-600"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${modal.whatsappToegevoegd ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <div>
                <span className="text-sm font-medium text-slate-300">Toegevoegd aan groep</span>
                <p className="text-xs text-slate-500">
                  {modal.whatsappToegevoegd ? "Al toegevoegd aan de WhatsApp-groep" : "Nog niet toegevoegd aan de WhatsApp-groep"}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className={LABEL}>Bonuspunten</label>
            <input type="number" value={form.bonusPoints} onChange={(e) => setForm({ ...form, bonusPoints: e.target.value })} className={INPUT} min="0" />
          </div>

          {modal.betaaldAkkoord && (
            <p className="text-xs text-slate-500 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2">
              ✓ Deelnemer heeft akkoord gegeven voor betaling bij inschrijving
            </p>
          )}

          {saveError && <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">{saveError}</p>}
          {saveMsg && <p className="text-green-400 text-sm">{saveMsg}</p>}
        </div>

        <div className="flex items-center justify-between mt-6">
          <div>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)} className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-500/20 rounded-lg transition-colors">
                Verwijderen
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Zeker weten?</span>
                <button onClick={onDelete} disabled={deleting} className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors">
                  {deleting ? "Verwijderen..." : "Ja, verwijder"}
                </button>
                <button onClick={() => setDeleteConfirm(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors">
                  Annuleer
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className={BTN_SECONDARY}>Sluiten</button>
            <button onClick={onSave} disabled={saving} className={BTN_PRIMARY}>{saving ? "Opslaan..." : "Opslaan"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
