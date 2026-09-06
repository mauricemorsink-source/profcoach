"use client";

import { useState, useEffect } from "react";
import AdminTeamEditModal from "./AdminTeamEditModal";

type TeamPlayer = {
  slotIndex: number;
  totalPoints: number;
  player: { id: string; name: string; position: string; clubTeam: string };
};

type Prediction = {
  topScorer: { id: string; name: string } | null;
  assistKoning: { id: string; name: string } | null;
  totalYellowCards: number | null;
  totalGoals: number | null;
};

type PredictionBonusBreakdown = {
  topScorer: number;
  assistKoning: number;
  yellowCards: number;
  totalGoals: number;
};

type Deelnemer = {
  id: string;
  voornaam: string | null;
  achternaam: string | null;
  email: string | null;
  telefoonnummer: string | null;
  whatsappGroep: boolean;
  betaaldAkkoord: boolean;
  betaald: boolean;
  bonusPoints: number;
  captainPoints: number;
  captainSlot: number | null;
  createdAt: string;
  formation: { id: string; code: string } | null;
  players: TeamPlayer[];
  prediction: Prediction | null;
  predictionBonusBreakdown: PredictionBonusBreakdown | null;
};

const POSITION_SHORT: Record<string, string> = { GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN" };
const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};
const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-colors";
const LABEL = "block text-sm font-medium text-slate-400 mb-1";
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700";
const BTN_SMALL = "px-3 py-1.5 text-xs bg-slate-800 text-slate-400 rounded hover:bg-slate-700 font-medium border border-slate-700 transition-colors";

export default function DeelnemersClient() {
  const [deelnemers, setDeelnemers] = useState<Deelnemer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<Deelnemer | null>(null);
  const [form, setForm] = useState({ voornaam: "", achternaam: "", email: "", telefoonnummer: "", whatsappGroep: false, bonusPoints: "0" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [betaaldFilter, setBetaaldFilter] = useState<"alle" | "betaald" | "nietbetaald">("alle");
  const [teamEditTarget, setTeamEditTarget] = useState<Deelnemer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/deelnemers");
    if (res.ok) setDeelnemers(await res.json());
    setLoading(false);
  }

  async function toggleBetaald(d: Deelnemer) {
    const res = await fetch(`/api/admin/deelnemers/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ betaald: !d.betaald }),
    });
    if (res.ok) {
      setDeelnemers((prev) => prev.map((x) => x.id === d.id ? { ...x, betaald: !d.betaald } : x));
      setModal((prev) => prev?.id === d.id ? { ...prev, betaald: !d.betaald } : prev);
    }
  }

  async function save() {
    if (!modal) return;
    setSaving(true);
    setSaveError("");
    setSaveMsg("");
    const res = await fetch(`/api/admin/deelnemers/${modal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voornaam: form.voornaam,
        achternaam: form.achternaam,
        email: form.email,
        telefoonnummer: form.telefoonnummer,
        whatsappGroep: form.whatsappGroep,
        bonusPoints: Number(form.bonusPoints) || 0,
      }),
    });
    setSaving(false);
    if (!res.ok) { setSaveError("Opslaan mislukt"); return; }
    setModal(null);
    await load();
  }

  async function deleteDeelnemer() {
    if (!modal) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/deelnemers/${modal.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setModal(null);
      setDeleteConfirm(false);
      await load();
    }
  }

  function openModal(d: Deelnemer) {
    setDeleteConfirm(false);
    setForm({
      voornaam: d.voornaam ?? "",
      achternaam: d.achternaam ?? "",
      email: d.email ?? "",
      telefoonnummer: d.telefoonnummer ?? "",
      whatsappGroep: d.whatsappGroep,
      bonusPoints: String(d.bonusPoints),
    });
    setSaveError("");
    setSaveMsg("");
    setModal(d);
  }

  useEffect(() => { load(); }, []);

  const filtered = deelnemers.filter((d) =>
    betaaldFilter === "betaald" ? d.betaald :
    betaaldFilter === "nietbetaald" ? !d.betaald : true
  );

  const aantalBetaald = deelnemers.filter((d) => d.betaald).length;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Deelnemers */}
      <section className="bg-slate-900 neon-border rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-white">Deelnemers</h2>
            {deelnemers.length > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">
                <span className={aantalBetaald === deelnemers.length && deelnemers.length > 0 ? "text-green-400 font-semibold" : "text-amber-400 font-semibold"}>
                  {aantalBetaald}/{deelnemers.length} betaald
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
              {(["alle", "betaald", "nietbetaald"] as const).map((v) => (
                <button key={v} onClick={() => setBetaaldFilter(v)}
                  className={`px-3 py-1.5 font-medium transition-colors ${betaaldFilter === v ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                  {v === "alle" ? "Alle" : v === "betaald" ? "Betaald" : "Niet betaald"}
                </button>
              ))}
            </div>
            <button onClick={load} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Vernieuwen</button>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm py-4">Laden...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-sm py-4">Geen deelnemers gevonden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800">
                  <th className="pb-2 font-semibold">Naam</th>
                  <th className="pb-2 font-semibold hidden sm:table-cell">E-mail</th>
                  <th className="pb-2 font-semibold">Team</th>
                  <th className="pb-2 font-semibold">Betaald</th>
                  <th className="pb-2 font-semibold text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="py-2 font-medium text-white whitespace-nowrap">
                      {d.voornaam || d.achternaam
                        ? `${d.voornaam ?? ""} ${d.achternaam ?? ""}`.trim()
                        : <span className="text-slate-500 italic">Geen naam</span>}
                    </td>
                    <td className="py-2 text-slate-400 text-xs hidden sm:table-cell">{d.email ?? "—"}</td>
                    <td className="py-2 whitespace-nowrap">
                      {d.formation
                        ? <span className="text-xs bg-cyan-900/30 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">{d.formation.code}</span>
                        : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border whitespace-nowrap ${d.betaald ? "bg-green-900/40 text-green-400 border-green-500/30" : "bg-slate-800 text-slate-500 border-slate-700"}`}>
                        {d.betaald ? "Betaald" : "Niet betaald"}
                      </span>
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button onClick={() => openModal(d)} className={BTN_SMALL} aria-label="Details">
                        <svg className="w-3.5 h-3.5 sm:hidden" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path d="M10 3.5c-4.14 0-7.4 3.06-8.5 6.5 1.1 3.44 4.36 6.5 8.5 6.5s7.4-3.06 8.5-6.5c-1.1-3.44-4.36-6.5-8.5-6.5Zm0 11a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                        </svg>
                        <span className="hidden sm:inline">Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-600 mt-2">{filtered.length} deelnemers</p>
          </div>
        )}
      </section>

      {/* Modal */}
      {teamEditTarget && (
        <AdminTeamEditModal
          deelnemerId={teamEditTarget.id}
          deelnemerNaam={
            teamEditTarget.voornaam || teamEditTarget.achternaam
              ? `${teamEditTarget.voornaam ?? ""} ${teamEditTarget.achternaam ?? ""}`.trim()
              : "Deelnemer"
          }
          initialFormationId={teamEditTarget.formation?.id ?? null}
          initialSlots={(() => {
            const slots: (string | null)[] = Array(11).fill(null);
            for (const tp of teamEditTarget.players) {
              slots[tp.slotIndex] = tp.player.id;
            }
            return slots;
          })()}
          initialCaptainSlot={teamEditTarget.captainSlot}
          onClose={() => setTeamEditTarget(null)}
          onSaved={async () => {
            setTeamEditTarget(null);
            setModal(null);
            await load();
          }}
        />
      )}

      {modal && (
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
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
            </div>

            {/* Team */}
            <div className="mb-5 pb-5 border-b border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Team</p>
                <button onClick={() => setTeamEditTarget(modal)} className={BTN_SMALL}>Team bewerken</button>
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
                <button type="button" onClick={() => toggleBetaald(modal)}
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
                    <button onClick={deleteDeelnemer} disabled={deleting} className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors">
                      {deleting ? "Verwijderen..." : "Ja, verwijder"}
                    </button>
                    <button onClick={() => setDeleteConfirm(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors">
                      Annuleer
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModal(null)} className={BTN_SECONDARY}>Sluiten</button>
                <button onClick={save} disabled={saving} className={BTN_PRIMARY}>{saving ? "Opslaan..." : "Opslaan"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
