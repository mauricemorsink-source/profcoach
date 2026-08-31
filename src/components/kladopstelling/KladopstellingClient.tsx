"use client";

import { useState, useEffect, useMemo } from "react";
import type { Formation, Player, SlotDef } from "@/components/team/types";
import { buildSlots } from "@/components/team/formationSlots";
import { validateTeam, CLUB_LABEL } from "@/components/team/validate";
import Pitch from "@/components/team/Pitch";
import SpotlightTour, { TOUR_KEY, type TourStep } from "@/components/SpotlightTour";
import RegistrationClosedNotice from "@/components/RegistrationClosedNotice";
import GoalConfetti from "@/components/GoalConfetti";
import { trackEvent } from "@/lib/analytics";

const STEP_NAMES: Record<number, string> = {
  1: "team_samenstellen",
  2: "aanvoerder_kiezen",
  3: "voorspellingen",
  4: "gegevens_en_indienen",
};

const SLOTS_KEY = "profcoach_team_slots";
const FORMATION_KEY = "profcoach_team_formation";

const POSITION_LABEL: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};
const CLUB_ORDER = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];
const POS_ORDER = ["GK", "DEF", "MID", "ATT"];
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700 disabled:opacity-50";
const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";

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
  deadline: string | null;
  captainEnabled: boolean;
  captainBonusPerWin: number;
  registrationClosedTitle?: string;
  registrationClosedText?: string;
}

interface PredPointsConfig {
  showPointsToParticipants: boolean;
  topScorerPoints: number;
  assistKoningPoints: number;
  yellowCardsPoints: number;
  totalGoalsPoints: number;
}

interface PersonInfo {
  voornaam: string;
  achternaam: string;
  email: string;
  telefoonnummer: string;
  whatsappGroep: boolean;
}

export default function KladopstellingClient({
  formations, budget, requireLogin, inschrijfgeld, registrationOpen, deadline, captainEnabled, captainBonusPerWin,
  registrationClosedTitle, registrationClosedText,
}: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [formationId, setFormationId] = useState<string>(formations[0]?.id ?? "");
  const [slotValues, setSlotValues] = useState<(string | null)[]>(Array(11).fill(null));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [captainSlot, setCaptainSlot] = useState<number | null>(null);

  // Voorspellingen
  const [predPointsConfig, setPredPointsConfig] = useState<PredPointsConfig | null>(null);
  const [predTopScorerId, setPredTopScorerId] = useState<string | null>(null);
  const [predAssistKoningId, setPredAssistKoningId] = useState<string | null>(null);
  const [predYellowCards, setPredYellowCards] = useState<string>("");
  const [predTotalGoals, setPredTotalGoals] = useState<string>("");
  const [predSearch, setPredSearch] = useState("");
  const [predActiveField, setPredActiveField] = useState<"topscorer" | "assistkoning" | null>(null);

  // Persoonsgegevens + indienen
  const [personInfo, setPersonInfo] = useState<PersonInfo>({
    voornaam: "", achternaam: "", email: "", telefoonnummer: "", whatsappGroep: false,
  });
  const [betaaldAkkoord, setBetaaldAkkoord] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Stap
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [showTour, setShowTour] = useState(false);

  const TOUR_STEPS: TourStep[] = [
    {
      target: "tour-formation",
      title: "Kies je formatie",
      body: "Begin met het kiezen van een formatie. Dit bepaalt hoeveel verdedigers, middenvelders en aanvallers je team heeft.",
    },
    {
      target: "tour-validation",
      title: "Budget & teamregels",
      body: "Hier zie je of je team aan alle eisen voldoet: 11 spelers, binnen budget, en minimaal 1 en maximaal 2 spelers per elftal.",
    },
    {
      target: "tour-pitch",
      title: "Speler toevoegen",
      body: "Klik op een positie op het veld om een speler te kiezen. Klik 'Volgende' om te zien hoe de spelerslijst eruitziet.",
    },
    {
      target: "tour-picker",
      title: "Speler kiezen uit de lijst",
      body: "Typ een naam of elftal om te zoeken. Klik op een speler om hem toe te voegen aan die positie.",
      tooltipPosition: "fixed-bottom" as const,
    },
    {
      target: "tour-next",
      title: "Naar de volgende stap",
      body: "Zodra alle regels groen zijn en je 11 spelers hebt gekozen, klik je hier om verder te gaan met je inschrijving.",
    },
    ...(captainEnabled ? [{
      target: "tour-captain",
      title: "Stap 2: Aanvoerder kiezen",
      body: "Daarna kies je een aanvoerder uit je team. Verplicht — die verdient voor elke overwinning extra bonuspunten.",
    }] : []),
    {
      target: "tour-predictions",
      title: "Stap 3: Bonusvoorspellingen",
      body: "Tot slot vul je nog een paar bonusvoorspellingen in, zoals topscorer en assistkoning. Dat hoeft niet uit je eigen team te komen — je kiest uit alle spelers in het spel!",
    },
  ];

  const deadlinePassed = !!deadline && new Date(deadline) <= new Date();
  const registrationClosed = !registrationOpen || deadlinePassed;
  const canSubmitPublic = registrationOpen && !requireLogin && !deadlinePassed;

  const formation = formations.find((f) => f.id === formationId) ?? formations[0];
  const slots: SlotDef[] = useMemo(() => buildSlots(formation), [formation]);
  const playersById = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);
  const validation = useMemo(
    () => validateTeam(slotValues, playersById, formation, budget, captainEnabled, captainSlot, slots),
    [slotValues, playersById, formation, budget, captainEnabled, captainSlot, slots]
  );
  const stepOneValidation = useMemo(
    () => validateTeam(slotValues, playersById, formation, budget, false, null, slots),
    [slotValues, playersById, formation, budget, slots]
  );
  const teamValid = stepOneValidation.allValid;
  const hasMismatch = stepOneValidation.rules.some((r) => r.key === "positions" && !r.met);
  const predValid = predTopScorerId !== null && predAssistKoningId !== null && predYellowCards.trim() !== "" && predTotalGoals.trim() !== "";

  useEffect(() => {
    async function init() {
      const [playersRes, predConfigRes] = await Promise.all([
        fetch("/api/players"),
        fetch("/api/prediction-config"),
      ]);
      if (playersRes.ok) setPlayers(await playersRes.json());
      if (predConfigRes.ok) setPredPointsConfig(await predConfigRes.json());

      const savedFormation = localStorage.getItem(FORMATION_KEY);
      const savedSlots = localStorage.getItem(SLOTS_KEY);
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
      if (!localStorage.getItem(TOUR_KEY)) setShowTour(true);
    }
    init();
  }, []);

  function handleTourStepEnter(i: number) {
    const target = TOUR_STEPS[i]?.target;
    if (target === "tour-picker") { setSelectedSlot(0); setShowPickerModal(true); }
    if (target === "tour-captain") setStep(2);
    if (target === "tour-predictions") setStep(3);
  }

  function handleTourStepLeave(i: number) {
    const target = TOUR_STEPS[i]?.target;
    if (target === "tour-picker") { setShowPickerModal(false); setSelectedSlot(null); }
  }

  useEffect(() => {
    if (!loading) localStorage.setItem(SLOTS_KEY, JSON.stringify(slotValues));
  }, [slotValues, loading]);

  useEffect(() => {
    if (!loading) localStorage.setItem(FORMATION_KEY, formationId);
  }, [formationId, loading]);

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

  function handleReset() {
    setSlotValues(Array(11).fill(null));
    setFormationId(formations[0]?.id ?? "");
    setCaptainSlot(null);
    setStep(1);
  }

  function scrollTop() { window.scrollTo({ top: 0, behavior: "instant" }); }

  function goNext() {
    setSubmitError(null);
    const next = step === 1 ? (captainEnabled ? 2 : 3) : step === 2 ? 3 : step === 3 ? 4 : step;
    setStep(next);
    trackEvent("team_indienen_stap", { stap: next, stap_naam: STEP_NAMES[next] });
    scrollTop();
  }

  function goPrev() {
    setSubmitError(null);
    if (step === 4) setStep(3);
    else if (step === 3) setStep(captainEnabled ? 2 : 1);
    else if (step === 2) setStep(1);
    scrollTop();
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^(\+31|0)[1-9][0-9]{7,8}$|^(\+31|0)6[0-9]{8}$/;

  function normalizePhone(p: string) { return p.replace(/[\s\-().]/g, ""); }

  async function handleSubmit() {
    if (!personInfo.voornaam.trim()) { setSubmitError("Voornaam is verplicht"); return; }
    if (!personInfo.achternaam.trim()) { setSubmitError("Achternaam is verplicht"); return; }
    if (!personInfo.email.trim()) { setSubmitError("Mailadres is verplicht"); return; }
    if (!EMAIL_RE.test(personInfo.email.trim())) { setSubmitError("Vul een geldig e-mailadres in (bijv. jan@voorbeeld.nl)"); return; }
    if (!personInfo.telefoonnummer.trim()) { setSubmitError("Telefoonnummer is verplicht"); return; }
    if (!PHONE_RE.test(normalizePhone(personInfo.telefoonnummer))) { setSubmitError("Vul een geldig telefoonnummer in (bijv. 06 12345678 of +31 6 12345678)"); return; }
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
          captainSlot,
          topScorerId: predTopScorerId || null,
          assistKoningId: predAssistKoningId || null,
          totalYellowCards: predYellowCards !== "" ? Number(predYellowCards) : null,
          totalGoals: predTotalGoals !== "" ? Number(predTotalGoals) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Er is een fout opgetreden");
      } else {
        trackEvent("team_ingediend");
        setSubmitted(true);
        localStorage.removeItem(SLOTS_KEY);
        localStorage.removeItem(FORMATION_KEY);
      }
    } catch {
      setSubmitError("Verbindingsfout. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  const visibleSteps = captainEnabled ? [1, 2, 3, 4] : [1, 3, 4];
  const totalSteps = canSubmitPublic ? visibleSteps.length : 1;
  const displayStep = visibleSteps.indexOf(step) + 1;
  const inschrijfgeldDisplay = (inschrijfgeld / 100).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const activeSlot = selectedSlot !== null ? slots[selectedSlot] : null;
  const currentInSlot = activeSlot ? slotValues[activeSlot.slotIndex] : null;
  const chosenIds = new Set(slotValues.filter(Boolean) as string[]);
  const selectedPlayers = slots
    .map((slot) => ({ slot, playerId: slotValues[slot.slotIndex] }))
    .filter((x) => x.playerId !== null) as { slot: SlotDef; playerId: string }[];

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
          const posDiff = POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position);
          if (posDiff !== 0) return posDiff;
          return a.name.localeCompare(b.name, "nl");
        })
    : [];

  function PredPlayerPicker({ field, value, onSelect }: { field: "topscorer" | "assistkoning"; value: string | null; onSelect: (id: string) => void }) {
    const isOpen = predActiveField === field;
    const filteredPlayers = players
      .filter(p => !predSearch.trim() || p.name.toLowerCase().includes(predSearch.toLowerCase()) || CLUB_LABEL[p.clubTeam]?.toLowerCase().includes(predSearch.toLowerCase()))
      .sort((a, b) => {
        const clubDiff = CLUB_ORDER.indexOf(a.clubTeam) - CLUB_ORDER.indexOf(b.clubTeam);
        if (clubDiff !== 0) return clubDiff;
        const posDiff = POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position);
        if (posDiff !== 0) return posDiff;
        return a.name.localeCompare(b.name, "nl");
      });
    return (
      <div className="relative">
        {isOpen && <div className="fixed inset-0 z-[45]" onClick={() => { setPredActiveField(null); setPredSearch(""); }} />}
        <button
          onClick={() => { setPredActiveField(isOpen ? null : field); setPredSearch(""); }}
          className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors relative z-[46] ${value ? "border-cyan-500/40 bg-cyan-500/10 text-white" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"}`}
        >
          {value ? (players.find(p => p.id === value)?.name ?? "Gekozen") : "Kies een speler..."}
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-[47] mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-slate-800">
              <input autoFocus type="text" placeholder="Zoek op naam of elftal..." value={predSearch} onChange={(e) => setPredSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40" />
            </div>
            <div className="overflow-y-auto max-h-[352px]">
              {filteredPlayers.length === 0
                ? <p className="text-slate-500 text-sm text-center py-4">Geen spelers gevonden</p>
                : filteredPlayers.map(p => (
                  <button key={p.id} onClick={() => { onSelect(p.id); setPredActiveField(null); setPredSearch(""); }}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-800 transition-colors flex items-center justify-between border-b border-slate-800/40 last:border-0 ${value === p.id ? "text-cyan-400" : "text-white"}`}>
                    <span>{p.name}</span>
                    <span className="text-slate-500 text-xs">{CLUB_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Spelers laden...</div>;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#060b14]">
        <GoalConfetti />
        <div className="max-w-xl mx-auto px-4 py-8 pb-16">
          {/* Bevestiging */}
          <div className="mb-5 bg-green-900/20 border border-green-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-green-400 text-xl shrink-0">✓</span>
            <div>
              <p className="text-green-400 font-bold text-sm">Team ingediend</p>
              <p className="text-slate-400 text-xs mt-0.5">Je inschrijving is ontvangen voor {personInfo.voornaam} {personInfo.achternaam}.</p>
            </div>
          </div>

          {/* Screenshot tip */}
          <div className="mb-5 bg-amber-900/15 border border-amber-500/25 rounded-2xl px-5 py-4">
            <p className="text-amber-400 font-semibold text-sm mb-1">Tip: maak een screenshot</p>
            <p className="text-slate-400 text-sm">
              Bewaar een foto of screenshot van je team hieronder, zodat je altijd kunt terugzien welke spelers je hebt gekozen.
            </p>
          </div>

          {/* Team overzicht header */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Jouw team — {formation?.code}</p>
            <span className="text-xs bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-semibold">Ingediend</span>
          </div>

          {/* Pitch */}
          <Pitch
            slots={slots}
            selectedSlot={null}
            playersById={playersById}
            slotValues={slotValues}
            onSlotClick={() => {}}
            locked={true}
            captainSlot={captainEnabled ? captainSlot : null}
          />

          {/* Spelerlijst */}
          <div className="mt-5 bg-slate-900 neon-border rounded-2xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800 bg-slate-800/50">
                  <th className="px-4 py-2.5 font-semibold">Speler</th>
                  <th className="px-4 py-2.5 font-semibold">Elftal</th>
                  <th className="px-4 py-2.5 font-semibold text-right">€</th>
                </tr>
              </thead>
              <tbody>
                {slots
                  .filter((s) => slotValues[s.slotIndex])
                  .sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position))
                  .map((s) => {
                    const player = playersById[slotValues[s.slotIndex]!];
                    if (!player) return null;
                    const isCaptain = captainEnabled && captainSlot === s.slotIndex;
                    return (
                      <tr key={s.slotIndex} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 font-medium text-white">
                          {player.name}
                          {isCaptain && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">C</span>}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">{CLUB_LABEL[player.clubTeam] ?? player.clubTeam}</td>
                        <td className="px-4 py-2.5 text-right text-cyan-400 font-bold">{player.value}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => { window.location.href = "/"; }}
            className={BTN_SECONDARY + " w-full"}
          >
            Terug naar de homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14]">
      {showTour && step !== 4 && (
        <SpotlightTour
          steps={TOUR_STEPS}
          onDone={() => { setShowTour(false); setStep(1); window.scrollTo({ top: 0, behavior: "instant" }); }}
          onStepEnter={handleTourStepEnter}
          onStepLeave={handleTourStepLeave}
        />
      )}
      <div className="max-w-3xl mx-auto px-4 py-8 pb-16">

        {/* Header */}
        <div className="mb-5 space-y-3">
          {/* Rij 1: titel over volle breedte */}
          <div>
            <h1 className="text-xl font-black text-white">Team indienen</h1>
            <p className="text-slate-500 text-xs mt-0.5">Werk je team uit en puzzel oneindig tot je jouw ideale opstelling hebt samengesteld</p>
          </div>
          {/* Rij 2: formatie + tellers + leegmaken + uitleg */}
          <div className="flex flex-wrap items-center gap-2">
            {step === 1 && (
              <div data-tour="tour-formation">
                <select
                  value={formationId}
                  onChange={(e) => handleFormationChange(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                >
                  {formations.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-2 text-sm">
              <span className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300">
                {validation.selectedCount} / 11
              </span>
              <span className={`px-3 py-1 rounded-full border font-medium ${validation.totalValue > budget ? "bg-red-900/40 text-red-400 border-red-500/30" : "bg-green-900/40 text-green-400 border-green-500/30"}`}>
                €{validation.totalValue} / {budget}
              </span>
            </div>
            {step === 1 && (
              <button
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600"
              >
                Leegmaken
              </button>
            )}
            {step === 1 && (
              <button
                onClick={() => setShowTour(true)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 shrink-0"
                title="Uitleg"
              >
                ? Uitleg
              </button>
            )}
          </div>
        </div>

        {/* Stap-indicator */}
        {canSubmitPublic && totalSteps > 1 && (
          <div className="mb-5 flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= displayStep ? "bg-cyan-500" : "bg-slate-700"}`} />
            ))}
            <span className="text-xs text-slate-500 shrink-0 ml-1">Stap {displayStep} / {totalSteps}</span>
          </div>
        )}

        {/* ── STAP 1: Team samenstellen ── */}
        {step === 1 && (
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
                onSlotClick={handleSlotClick}
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
        )}

        {/* ── STAP 2: Aanvoerder ── */}
        {step === 2 && captainEnabled && (
          <>
            <div data-tour="tour-captain" className="bg-slate-900 neon-border rounded-2xl p-5">
              <p className="text-base font-bold text-white mb-1">Kies je aanvoerder</p>
              <p className="text-slate-400 text-sm mb-5">
                Kies je aanvoerder en maak kans op extra punten: jouw aanvoerder ontvangt voor iedere overwinning{" "}
                <span className="text-amber-400 font-bold">{captainBonusPerWin} extra punten</span>!
              </p>
              <div className="space-y-2">
                {selectedPlayers.map(({ slot, playerId }) => {
                  const player = playersById[playerId];
                  if (!player) return null;
                  const isCaptain = captainSlot === slot.slotIndex;
                  return (
                    <button
                      key={playerId}
                      onClick={() => setCaptainSlot(isCaptain ? null : slot.slotIndex)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${isCaptain ? "bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-400"}`}
                    >
                      <div className="flex items-center gap-3">
                        {isCaptain
                          ? <span className="w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center text-xs font-black text-amber-400">C</span>
                          : <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-500">C</span>}
                        <span>{player.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{POSITION_LABEL[player.position] ?? player.position}</span>
                    </button>
                  );
                })}
              </div>
              {captainSlot === null && (
                <div className="flex items-center gap-2 mt-3 bg-amber-900/20 border border-amber-500/30 rounded-xl px-3 py-2.5">
                  <span className="text-amber-400 shrink-0">!</span>
                  <p className="text-amber-300 text-xs font-medium">Je moet een aanvoerder kiezen om verder te gaan.</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={goPrev} className={BTN_SECONDARY}>← Vorige</button>
              <button onClick={goNext} disabled={captainSlot === null} className={BTN_PRIMARY + " ml-auto"}>Volgende stap →</button>
            </div>
          </>
        )}

        {/* ── STAP 3: Voorspellingen ── */}
        {step === 3 && (
          <>
            <div data-tour="tour-predictions" className="bg-slate-900 neon-border rounded-2xl p-5 space-y-5">
              <div>
                <p className="text-base font-bold text-white mb-1">Bonusvoorspellingen</p>
                <p className="text-slate-400 text-sm">Vul je voorspellingen in voor bonuspunten aan het einde van het seizoen. Dit kan na het indienen niet meer worden gewijzigd.</p>
                <p className="text-slate-500 text-sm mt-1">De topscorer en assistkoning hoeven niet in jouw eigen team te zitten — je kiest uit alle spelers in het spel.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                  Topscorer {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.topScorerPoints} pt)</span>}
                </label>
                <PredPlayerPicker field="topscorer" value={predTopScorerId} onSelect={setPredTopScorerId} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                  Assistkoning {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.assistKoningPoints} pt)</span>}
                </label>
                <PredPlayerPicker field="assistkoning" value={predAssistKoningId} onSelect={setPredAssistKoningId} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                  Totaal gele kaarten (dit seizoen) {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.yellowCardsPoints} pt)</span>}
                </label>
                <input type="number" min="0" value={predYellowCards} onChange={(e) => setPredYellowCards(e.target.value)}
                  className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                  Totaal doelpunten VV Rietmolen (dit seizoen) {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.totalGoalsPoints} pt)</span>}
                </label>
                <p className="text-xs text-slate-600 mb-1.5">Incl. eigen goals tegenstanders en spelers buiten het spel (jeugdspelers, nieuwe spelers etc.)</p>
                <input type="number" min="0" value={predTotalGoals} onChange={(e) => setPredTotalGoals(e.target.value)}
                  className={INPUT} />
              </div>
            </div>
            {!predValid && (
              <p className="text-xs text-amber-400 mt-3">Vul alle voorspellingen in om verder te gaan.</p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={goPrev} className={BTN_SECONDARY}>← Vorige</button>
              <button onClick={goNext} disabled={!predValid} className={BTN_PRIMARY + " ml-auto"}>Volgende stap →</button>
            </div>
          </>
        )}

        {/* ── STAP 4: Persoonsgegevens + indienen ── */}
        {step === 4 && (
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
                {submitting ? "Bezig..." : "Definitief indienen"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Speler picker modal */}
      {showPickerModal && activeSlot && (
        <div className={`fixed inset-0 bg-black/70 flex items-start justify-center pt-16 sm:pt-20 px-4 ${showTour ? "z-[94]" : "z-50"}`}>
          <div data-tour="tour-picker" className="bg-slate-900 neon-border w-full sm:max-w-md rounded-2xl max-h-[calc(85dvh-4rem)] sm:max-h-[80vh] flex flex-col">
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
                <button onClick={() => { setShowPickerModal(false); setSelectedSlot(null); }} className="text-slate-500 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center transition-colors">×</button>
              </div>
            </div>
            <div className="px-5 pt-3 pb-2">
              <input type="text" autoFocus placeholder="Zoek op naam of elftal..." value={playerSearch} onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
            </div>
            <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-1.5">
              {playerSearch.trim() !== "" && (
                <p className="text-xs text-slate-500 pb-1">
                  {modalPlayers.length === 0 ? "Geen spelers gevonden" : `${modalPlayers.length} speler${modalPlayers.length !== 1 ? "s" : ""} gevonden`}
                </p>
              )}
              {modalPlayers.length === 0
                ? <p className="text-slate-500 text-sm text-center py-8">Geen spelers gevonden.</p>
                : modalPlayers.map((player) => {
                  const isInThisSlot = currentInSlot === player.id;
                  const isElsewhere = chosenIds.has(player.id) && !isInThisSlot;
                  return (
                    <div key={player.id} onClick={() => handleSelectPlayer(player.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${isInThisSlot ? "border-cyan-500/50 bg-cyan-500/10" : isElsewhere ? "border-slate-800 bg-slate-800/30 opacity-50" : "border-slate-800 bg-slate-800/30 hover:border-cyan-500/40 hover:bg-slate-800"}`}>
                      <div>
                        <div className="font-semibold text-white text-sm">{player.name}</div>
                        <div className="text-xs text-slate-500">{CLUB_LABEL[player.clubTeam] ?? player.clubTeam}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-cyan-400 text-sm">€{player.value}</span>
                        {isInThisSlot && <span className="text-xs bg-cyan-900/40 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">Gekozen</span>}
                        {isElsewhere && <span className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-700">Elders</span>}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
