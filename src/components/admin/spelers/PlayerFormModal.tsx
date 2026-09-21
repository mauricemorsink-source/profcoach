import type { Player, PlayerForm } from "./types";
import { POSITIONS, TEAMS, POSITION_LABEL, TEAM_LABEL, INPUT, LABEL, SELECT, BTN_PRIMARY, BTN_SECONDARY } from "./constants";

type Props = {
  modal: "add" | "edit";
  editingPlayer: Player | null;
  form: PlayerForm;
  setForm: (f: PlayerForm) => void;
  formTouched: boolean;
  setFormTouched: (v: boolean) => void;
  formError: string;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
};

export default function PlayerFormModal({
  modal,
  editingPlayer,
  form,
  setForm,
  formTouched,
  setFormTouched,
  formError,
  saving,
  onClose,
  onSave,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          {modal === "add" ? "Nieuwe speler toevoegen" : "Speler bewerken"}
        </h3>
        {modal === "edit" && editingPlayer?.hasPlayedMatch && (
          <p className="text-xs text-amber-400/90 bg-amber-900/20 border border-amber-500/30 rounded-lg px-3 py-2 mb-4">
            Let op: deze speler heeft al een wedstrijd gespeeld. Het wijzigen van positie of elftal
            werkt niet met terugwerkende kracht — al verwerkte wedstrijden blijven meetellen met de
            oude positie/elftal totdat ze eventueel worden teruggedraaid of verwijderd, en gebruiken
            dan de nieuwe waarde. Wijzig dit alleen om een fout te corrigeren, niet voor een
            seizoenstransfer.
          </p>
        )}
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Naam</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setFormTouched(true);
              }}
              className={INPUT + (formTouched && !form.name.trim() ? " border-red-500/60" : "")}
              placeholder="Voornaam Achternaam"
            />
            {formTouched && !form.name.trim() && (
              <p className="text-xs text-red-400 mt-1">Naam is verplicht.</p>
            )}
          </div>
          <div>
            <label className={LABEL}>
              Weergavenaam op veld <span className="text-slate-600 font-normal">(optioneel)</span>
            </label>
            <input
              type="text"
              value={form.shortName}
              onChange={(e) => setForm({ ...form, shortName: e.target.value })}
              className={INPUT}
              placeholder="bijv. J. de Vries"
            />
            <p className="text-xs text-slate-600 mt-1">
              Wordt getoond op het voetbalveld. Laat leeg om de volledige naam te gebruiken.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Positie</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className={SELECT}
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {POSITION_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Elftal</label>
              <select
                value={form.clubTeam}
                onChange={(e) => setForm({ ...form, clubTeam: e.target.value })}
                className={SELECT}
              >
                {TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {TEAM_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>
              FLEX-team <span className="text-slate-500 font-normal">(speelt standaard in ander team)</span>
            </label>
            <select
              value={form.altTeam}
              onChange={(e) => setForm({ ...form, altTeam: e.target.value })}
              className={SELECT}
            >
              <option value="">— Geen (speler speelt in eigen team) —</option>
              {TEAMS.filter((t) => t !== form.clubTeam).map((t) => (
                <option key={t} value={t}>
                  {TEAM_LABEL[t]}
                </option>
              ))}
            </select>
            {form.altTeam && (
              <p className="text-xs text-amber-400/80 mt-1">
                Speler verschijnt standaard in de wedstrijdinvoer van {TEAM_LABEL[form.altTeam]}. Puntentelling
                blijft op {TEAM_LABEL[form.clubTeam]}.
              </p>
            )}
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3 space-y-1.5">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.selectable}
                  onChange={(e) => setForm({ ...form, selectable: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
              <span className="text-sm font-medium text-slate-300">Kiesbaar voor deelnemers</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${form.selectable ? "bg-green-900/40 text-green-400 border border-green-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"}`}>
                {form.selectable ? "Aan" : "Uit"}
              </span>
            </div>
            <p className="text-xs text-slate-500 ml-14">
              {form.selectable
                ? "De speler staat in de spelerslijst en heeft een waarde."
                : "De speler staat niet in de spelerslijst en kan niet worden gekozen. Hij of zij is wel beschikbaar bij het invoeren van wedstrijden. Een waarde is niet nodig."}
            </p>
          </div>
          {form.selectable && (
          <div>
            <label className={LABEL}>Waarde</label>
            <input
              type="number"
              value={form.value}
              onChange={(e) => {
                setForm({ ...form, value: e.target.value });
                setFormTouched(true);
              }}
              className={
                INPUT +
                (formTouched && (form.value === "" || Number(form.value) <= 0) ? " border-red-500/60" : "")
              }
              placeholder="bv. 120"
              min="1"
            />
            {formTouched && (form.value === "" || Number(form.value) <= 0) && (
              <p className="text-xs text-red-400 mt-1">Vul een geldige waarde in (groter dan 0).</p>
            )}
          </div>
          )}
          {formError && (
            <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">
              {formError}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className={BTN_SECONDARY}>
            Annuleer
          </button>
          <button
            onClick={onSave}
            disabled={saving || !form.name.trim() || (form.selectable && (!form.value || Number(form.value) <= 0))}
            className={BTN_PRIMARY}
          >
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}
