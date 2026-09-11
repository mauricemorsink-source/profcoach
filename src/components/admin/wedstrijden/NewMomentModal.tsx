import { INPUT, LABEL, BTN_PRIMARY, BTN_SECONDARY } from "./constants";

type NewMomentForm = { label: string; scheduledAt: string };

type Props = {
  newMomentForm: NewMomentForm;
  setNewMomentForm: (v: NewMomentForm) => void;
  setNewMomentModal: (v: boolean) => void;
  createMoment: () => void;
  newMomentSaving: boolean;
};

export default function NewMomentModal({
  newMomentForm,
  setNewMomentForm,
  setNewMomentModal,
  createMoment,
  newMomentSaving,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Nieuw publicatiemoment</h3>
          <button
            onClick={() => setNewMomentModal(false)}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Naam / omschrijving</label>
            <input
              type="text"
              value={newMomentForm.label}
              onChange={(e) => setNewMomentForm({ ...newMomentForm, label: e.target.value })}
              placeholder="bijv. Update speelronde 3"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Datum en tijd</label>
            <input
              type="datetime-local"
              value={newMomentForm.scheduledAt}
              onChange={(e) => setNewMomentForm({ ...newMomentForm, scheduledAt: e.target.value })}
              className={INPUT}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setNewMomentModal(false)} className={BTN_SECONDARY}>
            Annuleer
          </button>
          <button
            onClick={createMoment}
            disabled={newMomentSaving || !newMomentForm.label || !newMomentForm.scheduledAt}
            className={BTN_PRIMARY}
          >
            {newMomentSaving ? "Aanmaken..." : "Aanmaken"}
          </button>
        </div>
      </div>
    </div>
  );
}
