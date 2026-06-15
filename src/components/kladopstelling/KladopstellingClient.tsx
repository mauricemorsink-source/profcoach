"use client";

import { useState, useEffect, useMemo } from "react";
import type { Formation, Player, SlotDef } from "@/components/team/types";
import { buildSlots } from "@/components/team/formationSlots";
import { validateTeam, CLUB_LABEL } from "@/components/team/validate";
import Pitch from "@/components/team/Pitch";

const KLAD_SLOTS_KEY = "profcoach_klad_slots";
const KLAD_FORMATION_KEY = "profcoach_klad_formation";

const POSITION_LABEL: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};
const CLUB_ORDER = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];

function remapSlots(
  oldSlotValues: (string | null)[],
  newSlots: SlotDef[],
  playersById: Record<string, Player>
): (string | null)[] {
  const result: (string | null)[] = Array(11).fill(null);
  const byPos: Record<string, string[]> = {};
  for (const playerId of oldSlotValues) {
    if (!playerId) continue;
    const p = playersById[playerId];
    if (!p) continue;
    if (!byPos[p.position]) byPos[p.position] = [];
    byPos[p.position].push(playerId);
  }
  for (const slot of newSlots) {
    const available = byPos[slot.position];
    if (available?.length) result[slot.slotIndex] = available.shift()!;
  }
  const overflow = (Object.values(byPos) as string[][]).flat();
  for (const slot of newSlots) {
    if (result[slot.slotIndex] === null && overflow.length)
      result[slot.slotIndex] = overflow.shift()!;
  }
  return result;
}

interface Props {
  formations: Formation[];
  budget: number;
  requireLogin: boolean;
  inschrijfgeld: number;
  registrationOpen: boolean;
}

type SubmitStep = 1 | 2;

interface PersonInfo {
  voornaam: string;
  achternaam: string;
  email: string;
  telefoonnummer: string;
  whatsappGroep: boolean;
}

const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const LABEL = "block text-xs font-medium text-slate-400 mb-1";

export default function KladopstellingClient({ formations, budget, requireLogin, inschrijfgeld, registrationOpen }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [formationId, setFormationId] = useState<string>(formations[0]?.id ?? "");
  const [slotValues, setSlotValues] = useState<(string | null)[]>(Array(11).fill(null));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");

  // Indienen modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitStep, setSubmitStep] = useState<SubmitStep>(1);
  const [personInfo, setPersonInfo] = useState<PersonInfo>({
    voornaam: "", achternaam: "", email: "", telefoonnummer: "", whatsappGroep: false,
  });
  const [betaaldAkkoord, setBetaaldAkkoord] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formation = formations.find((f) => f.id === formationId) ?? formations[0];
  const slots: SlotDef[] = useMemo(() => buildSlots(formation), [formation]);

  const playersById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players]
  );

  const validation = useMemo(
    () => validateTeam(slotValues, playersById, formation, budget, false, null, slots),
    [slotValues, playersById, formation, budget, slots]
  );

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/players");
      if (res.ok) setPlayers(await res.json());

      const savedFormation = localStorage.getItem(KLAD_FORMATION_KEY);
      const savedSlots = localStorage.getItem(KLAD_SLOTS_KEY);

      if (savedFormation && formations.find((f) => f.id === savedFormation)) {
        setFormationId(savedFormation);
      }
      if (savedSlots) {
        try {
          const parsed = JSON.parse(savedSlots);
          if (Array.isArray(parsed) && parsed.length === 11) setSlotValues(parsed);
        } catch { /* negeer */ }
      }

      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!loading) localStorage.setItem(KLAD_SLOTS_KEY, JSON.stringify(slotValues));
  }, [slotValues, loading]);

  useEffect(() => {
    if (!loading) localStorage.setItem(KLAD_FORMATION_KEY, formationId);
  }, [formationId, loading]);

  function handleFormationChange(newId: string) {
    const newFormation = formations.find((f) => f.id === newId);
    if (!newFormation) return;
    const newSlots = buildSlots(newFormation);
    setSlotValues((prev) => remapSlots(prev, newSlots, playersById));
    setFormationId(newId);
    setSelectedSlot(null);
    setShowPickerModal(false);
  }

  function handleSlotClick(slotIndex: number) {
    setSelectedSlot(slotIndex);
    setPlayerSearch("");
    setShowPickerModal(true);
  }

  function handleSelectPlayer(playerId: string) {
    if (selectedSlot === null) return;
    setSlotValues((prev) => {
      const next = [...prev];
      const existingIndex = next.indexOf(playerId);
      if (existingIndex !== -1) next[existingIndex] = null;
      next[selectedSlot] = playerId;
      return next;
    });
    setShowPickerModal(false);
    setSelectedSlot(null);
  }

  function handleClearSlot() {
    if (selectedSlot === null) return;
    setSlotValues((prev) => {
      const next = [...prev];
      next[selectedSlot] = null;
      return next;
    });
    setShowPickerModal(false);
    setSelectedSlot(null);
  }

  function handleReset() {
    setSlotValues(Array(11).fill(null));
    setFormationId(formations[0]?.id ?? "");
  }

  function openSubmitModal() {
    setSubmitStep(1);
    setSubmitError(null);
    setBetaaldAkkoord(false);
    setShowSubmitModal(true);
  }

  function closeSubmitModal() {
    if (submitting) return;
    setShowSubmitModal(false);
    setSubmitError(null);
  }

  function handleStep1Next() {
    if (!personInfo.voornaam.trim()) { setSubmitError("Voornaam is verplicht"); return; }
    if (!personInfo.achternaam.trim()) { setSubmitError("Achternaam is verplicht"); return; }
    if (!personInfo.email.trim()) { setSubmitError("Mailadres is verplicht"); return; }
    if (!personInfo.telefoonnummer.trim()) { setSubmitError("Telefoonnummer is verplicht"); return; }
    setSubmitError(null);
    setSubmitStep(2);
  }

  async function handleSubmit() {
    if (!betaaldAkkoord) { setSubmitError("Je moet akkoord gaan met het inschrijfgeld"); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/team/submit-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...personInfo,
          betaaldAkkoord,
          formationId,
          slots: slotValues,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Er is een fout opgetreden");
      } else {
        setSubmitted(true);
        localStorage.removeItem(KLAD_SLOTS_KEY);
        localStorage.removeItem(KLAD_FORMATION_KEY);
      }
    } catch {
      setSubmitError("Verbindingsfout. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmitPublic = !requireLogin && registrationOpen;
  const activeSlot = selectedSlot !== null ? slots[selectedSlot] : null;
  const currentInSlot = activeSlot ? slotValues[activeSlot.slotIndex] : null;
  const chosenIds = new Set(slotValues.filter(Boolean) as string[]);

  const modalPlayers = activeSlot
    ? players
        .filter((p) => p.position === activeSlot.position)
        .filter((p) =>
          playerSearch.trim() === "" ||
          p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
          CLUB_LABEL[p.clubTeam]?.toLowerCase().includes(playerSearch.toLowerCase())
        )
        .sort((a, b) => {
          const clubDiff = CLUB_ORDER.indexOf(a.clubTeam) - CLUB_ORDER.indexOf(b.clubTeam);
          if (clubDiff !== 0) return clubDiff;
          return a.name.localeCompare(b.name, "nl");
        })
    : [];

  const inschrijfgeldDisplay = (inschrijfgeld / 100).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Spelers laden...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14]">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-16">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Kladopstelling</h1>
          <p className="text-slate-400 text-sm mt-1">
            Werk je team uit en puzzel oneindig tot je jouw ideale opstelling hebt samengesteld
          </p>
        </div>

        {/* Info banner */}
        <div className="mb-5 bg-slate-900 border border-slate-700/60 rounded-2xl px-5 py-4">
          <p className="text-slate-300 text-sm font-medium">
            Dit is een vrije speelomgeving — geen account nodig.
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Je kunt hier vrijblijvend experimenteren met je opstelling. Jouw kladopstelling wordt alleen in deze browser opgeslagen.
          </p>
        </div>

        {/* Formation + tellers */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <select
            value={formationId}
            onChange={(e) => handleFormationChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          >
            {formations.map((f) => (
              <option key={f.id} value={f.id}>{f.code}</option>
            ))}
          </select>

          <span className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300 text-sm">
            {validation.selectedCount} / 11
          </span>
          <span className={`px-3 py-1 rounded-full border font-medium text-sm ${
            validation.totalValue > budget
              ? "bg-red-900/40 text-red-400 border-red-500/30"
              : "bg-green-900/40 text-green-400 border-green-500/30"
          }`}>
            €{validation.totalValue} / {budget}
          </span>

          <button
            onClick={handleReset}
            className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600"
          >
            Leegmaken
          </button>
        </div>

        {/* Validatie checklist */}
        {(() => {
          const v = validateTeam(slotValues, playersById, formation, budget, false, null, slots);
          const hasMismatch = v.rules.some(r => r.key === "positions" && !r.met);
          return (
            <div className={`mb-5 rounded-2xl border p-4 transition-colors ${v.allValid ? "bg-green-900/15 border-green-500/30" : "bg-red-900/15 border-red-500/20"}`}>
              {hasMismatch && (
                <div className="flex items-start gap-2 mb-3 bg-red-900/30 border border-red-500/40 rounded-xl px-3 py-2.5">
                  <span className="text-red-400 text-base shrink-0 mt-0.5">⚠</span>
                  <p className="text-red-300 text-xs font-medium">
                    Eén of meer spelers staan op een verkeerde positie door een formatiewijziging.
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
          );
        })()}

        {/* Veld */}
        <Pitch
          slots={slots}
          selectedSlot={selectedSlot}
          playersById={playersById}
          slotValues={slotValues}
          onSlotClick={handleSlotClick}
          locked={false}
          captainSlot={null}
        />

        {/* CTA onderaan */}
        <div className="mt-8 bg-cyan-900/20 border border-cyan-500/30 rounded-2xl px-5 py-5">
          <p className="text-white font-bold text-sm mb-1">Tevreden met je opstelling?</p>
          {canSubmitPublic ? (
            <>
              <p className="text-slate-400 text-sm mb-4">
                Dien je team hieronder direct in. Je hebt geen account nodig.
              </p>
              <button
                onClick={openSubmitModal}
                disabled={!validation.allValid}
                className="w-full py-3 px-6 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors neon-glow-sm"
              >
                {validation.allValid ? "Team indienen" : "Vul eerst alle 11 posities in"}
              </button>
            </>
          ) : (
            <p className="text-slate-400 text-sm">
              Dien je echte team in via <span className="text-cyan-400 font-medium">Mijn team</span> — daar kun je je opstelling officieel inschrijven voor het spel.
            </p>
          )}
        </div>
      </div>

      {/* Speler picker modal */}
      {showPickerModal && activeSlot && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 neon-border w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{activeSlot.label}</p>
                <h3 className="font-bold text-white">Kies {POSITION_LABEL[activeSlot.position] ?? activeSlot.position}</h3>
              </div>
              <div className="flex items-center gap-2">
                {currentInSlot && (
                  <button onClick={handleClearSlot} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-500/30 transition-colors">
                    Leegmaken
                  </button>
                )}
                <button
                  onClick={() => { setShowPickerModal(false); setSelectedSlot(null); }}
                  className="text-slate-500 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="px-5 pt-3 pb-2">
              <input
                type="text"
                autoFocus
                placeholder="Zoek op naam of elftal..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-1.5">
              {playerSearch.trim() !== "" && (
                <p className="text-xs text-slate-500 pb-1">
                  {modalPlayers.length === 0
                    ? "Geen spelers gevonden"
                    : `${modalPlayers.length} speler${modalPlayers.length !== 1 ? "s" : ""} gevonden`}
                </p>
              )}
              {modalPlayers.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Geen spelers gevonden.</p>
              ) : (
                modalPlayers.map((player) => {
                  const isInThisSlot = currentInSlot === player.id;
                  const isElsewhere = chosenIds.has(player.id) && !isInThisSlot;
                  return (
                    <div
                      key={player.id}
                      onClick={() => handleSelectPlayer(player.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isInThisSlot
                          ? "border-cyan-500/50 bg-cyan-500/10"
                          : isElsewhere
                          ? "border-slate-800 bg-slate-800/30 opacity-50"
                          : "border-slate-800 bg-slate-800/30 hover:border-cyan-500/40 hover:bg-slate-800"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white text-sm">{player.name}</div>
                        <div className="text-xs text-slate-500">{CLUB_LABEL[player.clubTeam] ?? player.clubTeam}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-cyan-400 text-sm">€{player.value}</span>
                        {isInThisSlot && (
                          <span className="text-xs bg-cyan-900/40 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">Gekozen</span>
                        )}
                        {isElsewhere && (
                          <span className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-700">Elders</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team indienen modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 neon-border w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90dvh] flex flex-col">
            {submitted ? (
              /* Bevestiging */
              <div className="flex flex-col items-center justify-center px-8 py-12 text-center gap-4">
                <div className="text-4xl">✅</div>
                <h3 className="text-xl font-black text-white">Team ingediend!</h3>
                <p className="text-slate-400 text-sm">
                  Je team is succesvol ingediend. Je ontvangt bericht via het opgegeven mailadres.
                </p>
                <button
                  onClick={() => { setShowSubmitModal(false); setSubmitted(false); }}
                  className="mt-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  Sluiten
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Stap {submitStep} van 2
                    </p>
                    <h3 className="font-bold text-white">
                      {submitStep === 1 ? "Jouw gegevens" : "Akkoord & indienen"}
                    </h3>
                  </div>
                  <button
                    onClick={closeSubmitModal}
                    disabled={submitting}
                    className="text-slate-500 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 px-5 py-5">
                  {submitStep === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={LABEL}>Voornaam *</label>
                          <input
                            type="text"
                            value={personInfo.voornaam}
                            onChange={(e) => setPersonInfo({ ...personInfo, voornaam: e.target.value })}
                            className={INPUT}
                            placeholder="Jan"
                          />
                        </div>
                        <div>
                          <label className={LABEL}>Achternaam *</label>
                          <input
                            type="text"
                            value={personInfo.achternaam}
                            onChange={(e) => setPersonInfo({ ...personInfo, achternaam: e.target.value })}
                            className={INPUT}
                            placeholder="Janssen"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={LABEL}>Mailadres *</label>
                        <input
                          type="email"
                          value={personInfo.email}
                          onChange={(e) => setPersonInfo({ ...personInfo, email: e.target.value })}
                          className={INPUT}
                          placeholder="jan@voorbeeld.nl"
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Telefoonnummer *</label>
                        <input
                          type="tel"
                          value={personInfo.telefoonnummer}
                          onChange={(e) => setPersonInfo({ ...personInfo, telefoonnummer: e.target.value })}
                          className={INPUT}
                          placeholder="06 12345678"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">
                          Het inschrijfgeld wordt via een Tikkie betaald. Voer je nummer in zodat we je dat kunnen sturen.
                        </p>
                      </div>
                      <div className="flex items-start gap-3 bg-slate-800/50 rounded-xl border border-slate-700 px-4 py-3">
                        <input
                          type="checkbox"
                          id="whatsapp"
                          checked={personInfo.whatsappGroep}
                          onChange={(e) => setPersonInfo({ ...personInfo, whatsappGroep: e.target.checked })}
                          className="mt-0.5 w-4 h-4 accent-cyan-500 shrink-0"
                        />
                        <label htmlFor="whatsapp" className="text-sm text-slate-300 cursor-pointer">
                          Voeg me toe aan de ProfCoach WhatsApp-groep voor updates over de tussenstand
                        </label>
                      </div>
                      {submitError && (
                        <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 px-3 py-2 rounded-lg">
                          {submitError}
                        </p>
                      )}
                      <button
                        onClick={handleStep1Next}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm transition-colors"
                      >
                        Volgende stap
                      </button>
                    </div>
                  )}

                  {submitStep === 2 && (
                    <div className="space-y-4">
                      {/* Samenvatting */}
                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 space-y-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Jouw gegevens</p>
                        <p className="text-sm text-white font-semibold">{personInfo.voornaam} {personInfo.achternaam}</p>
                        <p className="text-sm text-slate-400">{personInfo.email}</p>
                        <p className="text-sm text-slate-400">{personInfo.telefoonnummer}</p>
                      </div>

                      {inschrijfgeld > 0 && (
                        <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl px-4 py-3">
                          <p className="text-sm font-bold text-amber-300 mb-1">Inschrijfgeld: €{inschrijfgeldDisplay}</p>
                          <p className="text-xs text-slate-400">
                            Na het indienen ontvang je een Tikkie op je telefoonnummer voor het inschrijfgeld van €{inschrijfgeldDisplay}.
                          </p>
                        </div>
                      )}

                      <div className="flex items-start gap-3 bg-slate-800/50 rounded-xl border border-slate-700 px-4 py-3">
                        <input
                          type="checkbox"
                          id="akkoord"
                          checked={betaaldAkkoord}
                          onChange={(e) => setBetaaldAkkoord(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-cyan-500 shrink-0"
                        />
                        <label htmlFor="akkoord" className="text-sm text-slate-300 cursor-pointer">
                          {inschrijfgeld > 0
                            ? `Ik ga akkoord met het inschrijfgeld van €${inschrijfgeldDisplay} dat via een Tikkie wordt betaald`
                            : "Ik ga akkoord met de spelregels en dien mijn team definitief in"}
                        </label>
                      </div>

                      {submitError && (
                        <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 px-3 py-2 rounded-lg">
                          {submitError}
                        </p>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => { setSubmitStep(1); setSubmitError(null); }}
                          disabled={submitting}
                          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-colors border border-slate-700"
                        >
                          Terug
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={submitting || !betaaldAkkoord}
                          className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors neon-glow-sm"
                        >
                          {submitting ? "Indienen..." : "Definitief indienen"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
