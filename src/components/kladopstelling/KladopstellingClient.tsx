"use client";

import { useState, useEffect, useMemo } from "react";
import type { Player, SlotDef } from "@/components/team/types";
import { buildSlots } from "@/components/team/formationSlots";
import { validateTeam, CLUB_LABEL } from "@/components/team/validate";
import SpotlightTour, { TOUR_KEY, type TourStep } from "@/components/SpotlightTour";
import { trackEvent } from "@/lib/analytics";
import type { Props, PredPointsConfig, PersonInfo } from "./types";
import { STEP_NAMES, SLOTS_KEY, FORMATION_KEY, CLUB_ORDER, POS_ORDER } from "./constants";
import { remapSlots } from "./remapSlots";
import Step1TeamBuilder from "./Step1TeamBuilder";
import Step2Captain from "./Step2Captain";
import Step3Predictions from "./Step3Predictions";
import Step4PersonalInfo from "./Step4PersonalInfo";
import SuccessPage from "./SuccessPage";
import PlayerPickerModal from "./PlayerPickerModal";

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

  // Betaling
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  // Stap
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [showTour, setShowTour] = useState(false);

  // Scrol pas naar boven nadat React de nieuwe stap daadwerkelijk heeft gerenderd — een
  // scroll die synchroon met setStep() wordt aangeroepen kan op mobiel te vroeg uitvoeren
  // (nog tegen de oude, langere inhoud aan), waardoor je alsnog halverwege de nieuwe stap
  // uitkomt in plaats van bovenaan.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step, submitted]);

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

  function goNext() {
    setSubmitError(null);
    const next = step === 1 ? (captainEnabled ? 2 : 3) : step === 2 ? 3 : step === 3 ? 4 : step;
    setStep(next);
    trackEvent("team_indienen_stap", { stap: next, stap_naam: STEP_NAMES[next] });
  }

  function goPrev() {
    setSubmitError(null);
    if (step === 4) setStep(3);
    else if (step === 3) setStep(captainEnabled ? 2 : 1);
    else if (step === 2) setStep(1);
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

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Spelers laden...</div>;
  }

  if (submitted) {
    return (
      <SuccessPage
        personInfo={personInfo}
        formation={formation}
        slots={slots}
        playersById={playersById}
        slotValues={slotValues}
        captainEnabled={captainEnabled}
        captainSlot={captainSlot}
        showPaymentOptions={showPaymentOptions}
        setShowPaymentOptions={setShowPaymentOptions}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14]">
      {showTour && step !== 4 && (
        <SpotlightTour
          steps={TOUR_STEPS}
          onDone={() => { setShowTour(false); setStep(1); }}
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
          <Step1TeamBuilder
            stepOneValidation={stepOneValidation}
            hasMismatch={hasMismatch}
            slots={slots}
            selectedSlot={selectedSlot}
            playersById={playersById}
            slotValues={slotValues}
            onSlotClick={handleSlotClick}
            canSubmitPublic={canSubmitPublic}
            teamValid={teamValid}
            goNext={goNext}
            registrationClosed={registrationClosed}
            registrationClosedTitle={registrationClosedTitle}
            registrationClosedText={registrationClosedText}
          />
        )}

        {/* ── STAP 2: Aanvoerder ── */}
        {step === 2 && captainEnabled && (
          <Step2Captain
            selectedPlayers={selectedPlayers}
            playersById={playersById}
            captainSlot={captainSlot}
            setCaptainSlot={setCaptainSlot}
            captainBonusPerWin={captainBonusPerWin}
            goPrev={goPrev}
            goNext={goNext}
          />
        )}

        {/* ── STAP 3: Voorspellingen ── */}
        {step === 3 && (
          <Step3Predictions
            predPointsConfig={predPointsConfig}
            players={players}
            predTopScorerId={predTopScorerId}
            setPredTopScorerId={setPredTopScorerId}
            predAssistKoningId={predAssistKoningId}
            setPredAssistKoningId={setPredAssistKoningId}
            predActiveField={predActiveField}
            setPredActiveField={setPredActiveField}
            predSearch={predSearch}
            setPredSearch={setPredSearch}
            predYellowCards={predYellowCards}
            setPredYellowCards={setPredYellowCards}
            predTotalGoals={predTotalGoals}
            setPredTotalGoals={setPredTotalGoals}
            predValid={predValid}
            goPrev={goPrev}
            goNext={goNext}
          />
        )}

        {/* ── STAP 4: Persoonsgegevens + indienen ── */}
        {step === 4 && (
          <Step4PersonalInfo
            personInfo={personInfo}
            setPersonInfo={setPersonInfo}
            inschrijfgeld={inschrijfgeld}
            inschrijfgeldDisplay={inschrijfgeldDisplay}
            betaaldAkkoord={betaaldAkkoord}
            setBetaaldAkkoord={setBetaaldAkkoord}
            submitError={submitError}
            submitting={submitting}
            goPrev={goPrev}
            handleSubmit={handleSubmit}
          />
        )}

      </div>

      {/* Speler picker modal */}
      {showPickerModal && activeSlot && (
        <PlayerPickerModal
          activeSlot={activeSlot}
          playerSearch={playerSearch}
          setPlayerSearch={setPlayerSearch}
          modalPlayers={modalPlayers}
          currentInSlot={currentInSlot}
          chosenIds={chosenIds}
          handleSelectPlayer={handleSelectPlayer}
          handleClearSlot={handleClearSlot}
          onClose={() => { setShowPickerModal(false); setSelectedSlot(null); }}
          showTour={showTour}
        />
      )}
    </div>
  );
}
