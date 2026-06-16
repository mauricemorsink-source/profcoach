"use client";

import { useState, useEffect, useMemo } from "react";
import type { Formation, Player, SlotDef } from "@/components/team/types";
import { buildSlots } from "@/components/team/formationSlots";
import { validateTeam, CLUB_LABEL } from "@/components/team/validate";
import Pitch from "@/components/team/Pitch";

const POSITION_LABEL: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};
const POS_ORDER = ["GK", "DEF", "MID", "ATT"];
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700 disabled:opacity-50";

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
  token: string;
  formations: Formation[];
  budget: number;
  captainEnabled: boolean;
  captainBonusPerWin: number;
  initialFormationId: string;
  initialSlots: (string | null)[];
  initialCaptainSlot: number | null;
  initialPlayers: Record<string, Player>;
  naam: string;
}

export default function TeamAanpassenClient({
  token, formations, budget, captainEnabled, captainBonusPerWin,
  initialFormationId, initialSlots, initialCaptainSlot, initialPlayers, naam,
}: Props) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [formationId, setFormationId] = useState(initialFormationId);
  const [slotValues, setSlotValues] = useState<(string | null)[]>(initialSlots);
  const [captainSlot, setCaptainSlot] = useState<number | null>(initialCaptainSlot);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const formation = formations.find((f) => f.id === formationId) ?? formations[0];
  const slots: SlotDef[] = useMemo(() => buildSlots(formation), [formation]);

  // Merge initial players with all fetched players
  const playersById = useMemo(() => {
    const base = Object.fromEntries(allPlayers.map((p) => [p.id, p]));
    return { ...initialPlayers, ...base };
  }, [allPlayers, initialPlayers]);

  const validation = useMemo(
    () => validateTeam(slotValues, playersById, formation, budget, captainEnabled, captainSlot, slots),
    [slotValues, playersById, formation, budget, captainEnabled, captainSlot, slots]
  );
  const teamValid = useMemo(
    () => validateTeam(slotValues, playersById, formation, budget, false, null, slots).allValid,
    [slotValues, playersById, formation, budget, slots]
  );

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => { setAllPlayers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleFormationChange(newId: string) {
    const newFormation = formations.find((f) => f.id === newId);
    if (!newFormation) return;
    const newSlots = buildSlots(newFormation);
    setSlotValues((prev) => remapSlots(prev, newSlots, playersById));
    setFormationId(newId);
    setSelectedSlot(null);
    setShowPickerModal(false);
    setCaptainSlot(null);
  }

  function handleSlotClick(slotIndex: number) {
    if (step !== 1) return;
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
    if (captainSlot === selectedSlot) setCaptainSlot(null);
    setSlotValues((prev) => {
      const next = [...prev];
      next[selectedSlot] = null;
      return next;
    });
    setShowPickerModal(false);
    setSelectedSlot(null);
  }

  function scrollTop() { window.scrollTo({ top: 0, behavior: "instant" }); }

  function goNext() {
    setSubmitError(null);
    setStep(2);
    scrollTop();
  }

  function goPrev() {
    setSubmitError(null);
    setStep(1);
    scrollTop();
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/team/submit-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, formationId, slots: slotValues, captainSlot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Er is iets misgegaan.");
      } else {
        setSubmitted(true);
        scrollTop();
      }
    } catch {
      setSubmitError("Verbindingsfout. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  // Speler picker filter
  const slotDef = selectedSlot !== null ? slots[selectedSlot] : null;
  const filteredPickers = useMemo(() => {
    if (!slotDef) return [];
    const q = playerSearch.trim().toLowerCase();
    return allPlayers
      .filter((p) => p.position === slotDef.position)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || (CLUB_LABEL[p.clubTeam] ?? "").toLowerCase().includes(q))
      .sort((a, b) => {
        const byClub = ["ONE","TWO","THREE","FOUR","FIVE","DAMES"].indexOf(a.clubTeam) - ["ONE","TWO","THREE","FOUR","FIVE","DAMES"].indexOf(b.clubTeam);
        return byClub !== 0 ? byClub : a.name.localeCompare(b.name, "nl");
      });
  }, [allPlayers, slotDef, playerSearch]);

  // ── Success ────────────────────────────────────────────────────────────────
  if (submitted) {
    const teamPlayers = slotValues
      .map((id, i) => (id ? { player: playersById[id], slot: slots[i] } : null))
      .filter(Boolean) as { player: Player; slot: SlotDef }[];

    return (
      <div className="min-h-screen bg-[#060b14]">
        <div className="max-w-xl mx-auto px-4 py-8 pb-16">
          <div className="bg-green-900/30 border border-green-500/30 rounded-2xl p-5 mb-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <h1 className="text-xl font-black text-white">Team bijgewerkt!</h1>
            <p className="text-green-300 text-sm mt-1">Jouw aanpassing is opgeslagen.</p>
          </div>
          <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-cyan-300 text-center">
            💡 Tip: maak een screenshot van je team als bevestiging.
          </div>
          <Pitch slots={slots} slotValues={slotValues} playersById={playersById} onSlotClick={() => {}} captainSlot={captainSlot} selectedSlot={null} locked />
          <div className="mt-6 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest">Jouw team</div>
            {teamPlayers
              .sort((a, b) => POS_ORDER.indexOf(a.player.position) - POS_ORDER.indexOf(b.player.position))
              .map(({ player, slot }) => (
                <div key={player.id} className={`flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60 ${captainSlot === slot.slotIndex ? "bg-yellow-900/10" : ""}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border text-blue-400 bg-blue-900/30 border-blue-500/30">{POSITION_LABEL[player.position]}</span>
                    <span className="text-sm text-white font-medium truncate">{player.name}</span>
                    {captainSlot === slot.slotIndex && <span className="text-[10px] bg-yellow-900/40 text-yellow-300 border border-yellow-500/30 px-1.5 py-0.5 rounded-full font-bold">C</span>}
                  </div>
                  <span className="text-cyan-400 font-bold text-sm shrink-0">{player.value}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b14] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Spelers laden…</div>
      </div>
    );
  }

  // ── Stap indicatie ─────────────────────────────────────────────────────────
  const totalSteps = captainEnabled ? 2 : 1;
  const steps = captainEnabled
    ? [{ label: "Team" }, { label: "Aanvoerder" }]
    : [{ label: "Team" }];

  return (
    <div className="min-h-screen bg-[#060b14]">
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-black text-white">Team aanpassen</h1>
          {naam && <span className="text-slate-500 text-sm">Hoi {naam}</span>}
        </div>

        {/* Stap indicator */}
        {captainEnabled && (
          <div className="flex gap-1.5 mb-6">
            {steps.map((s, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i + 1 <= step ? "bg-cyan-500" : "bg-slate-800"}`} />
            ))}
          </div>
        )}

        {/* ── Stap 1: Team ── */}
        {step === 1 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <select
                value={formationId}
                onChange={(e) => handleFormationChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
              >
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>{f.code}</option>
                ))}
              </select>
              <div className="flex gap-2 text-xs text-slate-400 ml-auto">
                <span className={validation.totalValue > budget ? "text-red-400 font-bold" : "text-cyan-400 font-bold"}>
                  €{validation.totalValue}
                </span>
                <span className="text-slate-600">/ €{budget}</span>
              </div>
            </div>

            <Pitch
              slots={slots}
              slotValues={slotValues}
              playersById={playersById}
              onSlotClick={handleSlotClick}
              captainSlot={captainSlot}
              selectedSlot={selectedSlot}
              locked={false}
            />

            {validation.errors.length > 0 && (
              <div className="mt-4 space-y-1">
                {validation.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-1.5">{e}</p>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button className={BTN_PRIMARY} disabled={!teamValid} onClick={captainEnabled ? goNext : handleSubmit}>
                {captainEnabled ? "Volgende: aanvoerder →" : (submitting ? "Opslaan…" : "Wijzigingen opslaan")}
              </button>
            </div>
          </>
        )}

        {/* ── Stap 2: Aanvoerder ── */}
        {step === 2 && captainEnabled && (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white mb-1">Aanvoerder</h2>
              <p className="text-slate-400 text-sm">
                Kies je aanvoerder. Bij elke overwinning van zijn team krijg je +{captainBonusPerWin} punten extra.
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {slots.map((slot) => {
                const playerId = slotValues[slot.slotIndex];
                if (!playerId) return null;
                const player = playersById[playerId];
                if (!player) return null;
                const isCaptain = captainSlot === slot.slotIndex;
                return (
                  <button
                    key={slot.slotIndex}
                    onClick={() => setCaptainSlot(isCaptain ? null : slot.slotIndex)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                      isCaptain
                        ? "bg-yellow-900/30 border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.15)]"
                        : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      isCaptain ? "text-yellow-300 bg-yellow-900/40 border-yellow-500/40" : "text-slate-400 bg-slate-700 border-slate-600"
                    }`}>
                      {POSITION_LABEL[player.position]}
                    </span>
                    <span className={`font-semibold text-sm flex-1 ${isCaptain ? "text-yellow-200" : "text-white"}`}>
                      {player.name}
                    </span>
                    {isCaptain && <span className="text-yellow-300 font-black text-sm">C</span>}
                  </button>
                );
              })}
            </div>

            {submitError && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2 mb-4">{submitError}</p>
            )}

            <div className="flex gap-3 justify-between">
              <button className={BTN_SECONDARY} onClick={goPrev}>← Terug</button>
              <button
                className={BTN_PRIMARY}
                disabled={submitting || !captainSlot}
                onClick={handleSubmit}
              >
                {submitting ? "Opslaan…" : "Wijzigingen opslaan"}
              </button>
            </div>
          </>
        )}

        {/* ── Player picker modal ── */}
        {showPickerModal && slotDef && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col">
            <div className="bg-slate-900 border-b border-slate-800 px-4 pt-5 pb-3 flex items-center gap-3">
              <span className="text-sm font-bold text-white">Kies een {POSITION_LABEL[slotDef.position]}</span>
              <button onClick={() => { setShowPickerModal(false); setSelectedSlot(null); }} className="ml-auto text-slate-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Zoek speler…"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
              />
              {slotValues[selectedSlot!] && (
                <button onClick={handleClearSlot} className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-sm font-medium border border-red-500/20 whitespace-nowrap">
                  Verwijder
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredPickers.map((player) => {
                const inSlot = slotValues.includes(player.id);
                const isSelected = slotValues[selectedSlot!] === player.id;
                return (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer(player.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-slate-800/60 text-left transition-colors ${
                      isSelected ? "bg-cyan-900/30" : inSlot ? "bg-slate-800/40 opacity-60" : "hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="text-xs text-slate-400 w-24 shrink-0 truncate">{CLUB_LABEL[player.clubTeam] ?? player.clubTeam}</span>
                    <span className="flex-1 text-sm text-white font-medium truncate">{player.name}</span>
                    <span className="text-cyan-400 font-bold text-sm shrink-0">{player.value}</span>
                  </button>
                );
              })}
              {filteredPickers.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-8">Geen spelers gevonden.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
