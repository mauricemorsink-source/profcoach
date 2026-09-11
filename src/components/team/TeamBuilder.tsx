"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { Player, Formation, Season, SlotDef } from "./types";
import { buildSlots } from "./formationSlots";
import { validateTeam, CLUB_LABEL } from "./validate";
import { remapSlots } from "./builder/remapSlots";
import { DRAFT_KEY, predKey, CLUB_ORDER, POS_ORDER } from "./builder/constants";
import LockedTeamPanel from "./builder/LockedTeamPanel";
import Step1PlayerSelection from "./builder/Step1PlayerSelection";
import Step2Captain from "./builder/Step2Captain";
import Step3Predictions from "./builder/Step3Predictions";
import Step4Overview from "./builder/Step4Overview";
import PredictionModal from "./builder/PredictionModal";
import PlayerPickerModal from "./builder/PlayerPickerModal";

interface TeamBuilderProps {
  formations: Formation[];
  season: Season;
  budget: number;
  captainBonusPerWin?: number;
  readOnly?: boolean;
  deadline?: Date | null;
}

export default function TeamBuilder({ formations, season, budget, captainBonusPerWin = 5, readOnly = false, deadline }: TeamBuilderProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamEntryId, setTeamEntryId] = useState<string | null>(null);
  const [formationId, setFormationId] = useState<string>(formations[0]?.id ?? "");
  const [slotValues, setSlotValues] = useState<(string | null)[]>(Array(11).fill(null));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [captainEnabled, setCaptainEnabled] = useState(false);
  const [captainSlot, setCaptainSlot] = useState<number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [hasPrediction, setHasPrediction] = useState(false);
  const [predTopScorerId, setPredTopScorerId] = useState<string | null>(null);
  const [predAssistKoningId, setPredAssistKoningId] = useState<string | null>(null);
  const [predYellowCards, setPredYellowCards] = useState<string>("");
  const [predTotalGoals, setPredTotalGoals] = useState<string>("");
  const [predSearch, setPredSearch] = useState("");
  const [predActiveField, setPredActiveField] = useState<"topscorer" | "assistkoning" | null>(null);
  const [predSaving, setPredSaving] = useState(false);
  const [predPointsConfig, setPredPointsConfig] = useState<{ showPointsToParticipants: boolean; topScorerPoints: number; assistKoningPoints: number; yellowCardsPoints: number; totalGoalsPoints: number } | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"volgende" | "voorspellingen">("volgende");
  const pitchRef = useRef<HTMLDivElement>(null);

  const formation = formations.find((f) => f.id === formationId) ?? formations[0];
  const slots: SlotDef[] = useMemo(() => buildSlots(formation), [formation]);

  const playersById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players]
  );

  const validation = useMemo(
    () => validateTeam(slotValues, playersById, formation, budget, captainEnabled, captainSlot, slots),
    [slotValues, playersById, formation, budget, captainEnabled, captainSlot, slots]
  );

  // Team geldig zonder captain-check (voor stap 1 → 2 navigatie)
  const teamValid = useMemo(
    () => validateTeam(slotValues, playersById, formation, budget, false, null, slots).allValid,
    [slotValues, playersById, formation, budget, slots]
  );

  // Validatie voor stap 1 (checklist + foutmeldingen), zonder captain-check
  const stepOneValidation = useMemo(
    () => validateTeam(slotValues, playersById, formation, budget, false, null, slots),
    [slotValues, playersById, formation, budget, slots]
  );
  const hasMismatch = stepOneValidation.rules.some(r => r.key === "positions" && !r.met);

  useEffect(() => {
    async function init() {
      const [playersRes, draftRes, predConfigRes] = await Promise.all([
        fetch("/api/players"),
        fetch("/api/team/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftId: localStorage.getItem(DRAFT_KEY) ?? undefined }),
        }),
        fetch("/api/prediction-config"),
      ]);

      const playersData = await playersRes.json();
      const draftData = await draftRes.json();
      if (predConfigRes.ok) setPredPointsConfig(await predConfigRes.json());

      if (!draftRes.ok || !draftData.team) {
        setInitError(draftData.error || "Kon geen team laden");
        setLoading(false);
        return;
      }

      setPlayers(playersData);

      const team = draftData.team;
      setTeamEntryId(team.id);
      setFormationId(team.formationId);
      setLocked(team.locked);
      setCaptainEnabled(draftData.captainEnabled ?? false);
      setCaptainSlot(team.captainSlot ?? null);
      setHasPrediction(!!team.prediction);
      localStorage.setItem(DRAFT_KEY, team.id);

      const restored = Array(11).fill(null);
      for (const tp of team.players) {
        restored[tp.slotIndex] = tp.playerId;
      }
      setSlotValues(restored);

      // Herstel lokaal opgeslagen voorspellingen (als nog niet ingediend)
      if (!team.prediction) {
        const id = team.id;
        const ts = localStorage.getItem(predKey(id, "topscorer"));
        const ak = localStorage.getItem(predKey(id, "assistkoning"));
        const yc = localStorage.getItem(predKey(id, "yellowcards"));
        const tg = localStorage.getItem(predKey(id, "totalgoals"));
        if (ts) setPredTopScorerId(ts);
        if (ak) setPredAssistKoningId(ak);
        if (yc) setPredYellowCards(yc);
        if (tg) setPredTotalGoals(tg);
      }

      // Herstel laatste stap (niet als al ingediend)
      if (!team.locked && !readOnly) {
        const savedStep = localStorage.getItem(predKey(team.id, "step"));
        if (savedStep === "2" || savedStep === "3" || savedStep === "4") {
          setStep(Number(savedStep) as 2 | 3 | 4);
        }
      }

      setLoading(false);

      // Als team al ingediend is maar nog geen voorspelling ingevuld: modal direct tonen
      if (team.locked && !team.prediction && !readOnly) {
        setShowPredictionModal(true);
      }
    }
    init();
  }, []);

  function handleFormationChange(newFormationId: string) {
    const newFormation = formations.find((f) => f.id === newFormationId);
    if (!newFormation) return;
    const newSlots = buildSlots(newFormation);
    setSlotValues((prev) => remapSlots(prev, newSlots, playersById));
    setFormationId(newFormationId);
    setSelectedSlot(null);
    setShowPickerModal(false);
    setCaptainSlot(null);
  }

  function handleSlotClick(slotIndex: number) {
    if (locked || readOnly) return;
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

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    if (!teamEntryId) return;
    setSaving(true);
    const res = await fetch("/api/team/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamEntryId, formationId, slots: slotValues, captainSlot }),
    });
    setSaving(false);
    if (!res.ok) showToast("Opslaan mislukt. Probeer het opnieuw.", "error");
    return res.ok;
  }

  // Sla voorspellingen + stap lokaal op bij elke wijziging
  useEffect(() => {
    if (!teamEntryId || hasPrediction) return;
    if (predTopScorerId) localStorage.setItem(predKey(teamEntryId, "topscorer"), predTopScorerId);
    else localStorage.removeItem(predKey(teamEntryId, "topscorer"));
  }, [predTopScorerId, teamEntryId, hasPrediction]);

  useEffect(() => {
    if (!teamEntryId || hasPrediction) return;
    if (predAssistKoningId) localStorage.setItem(predKey(teamEntryId, "assistkoning"), predAssistKoningId);
    else localStorage.removeItem(predKey(teamEntryId, "assistkoning"));
  }, [predAssistKoningId, teamEntryId, hasPrediction]);

  useEffect(() => {
    if (!teamEntryId || hasPrediction) return;
    if (predYellowCards !== "") localStorage.setItem(predKey(teamEntryId, "yellowcards"), predYellowCards);
    else localStorage.removeItem(predKey(teamEntryId, "yellowcards"));
  }, [predYellowCards, teamEntryId, hasPrediction]);

  useEffect(() => {
    if (!teamEntryId || hasPrediction) return;
    if (predTotalGoals !== "") localStorage.setItem(predKey(teamEntryId, "totalgoals"), predTotalGoals);
    else localStorage.removeItem(predKey(teamEntryId, "totalgoals"));
  }, [predTotalGoals, teamEntryId, hasPrediction]);

  useEffect(() => {
    if (!teamEntryId || locked) return;
    localStorage.setItem(predKey(teamEntryId, "step"), String(step));
  }, [step, teamEntryId, locked]);

  function goNext() {
    if (step === 1) setStep(captainEnabled ? 2 : 3);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  }

  function goPrev() {
    if (step === 4) setStep(3);
    else if (step === 3) setStep(captainEnabled ? 2 : 1);
    else if (step === 2) setStep(1);
  }

  async function handleFinalSubmit() {
    if (!teamEntryId || !teamValid) return;
    setSaving(true);
    const saved = await handleSave();
    if (!saved) { setSaving(false); return; }
    const res = await fetch("/api/team/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamEntryId }),
    });
    if (!res.ok) {
      showToast("Indienen mislukt. Probeer het opnieuw.", "error");
      setSaving(false);
      return;
    }
    const data = await res.json();
    setLocked(data.team.locked);

    const hasPred = predTopScorerId || predAssistKoningId || predYellowCards !== "" || predTotalGoals !== "";
    if (hasPred) {
      const predRes = await fetch("/api/team/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamEntryId,
          topScorerId: predTopScorerId || null,
          assistKoningId: predAssistKoningId || null,
          totalYellowCards: predYellowCards !== "" ? Number(predYellowCards) : null,
          totalGoals: predTotalGoals !== "" ? Number(predTotalGoals) : null,
        }),
      });
      if (predRes.ok) setHasPrediction(true);
    }

    // Lokale opslag opruimen na definitief indienen
    if (teamEntryId) {
      ["topscorer", "assistkoning", "yellowcards", "totalgoals", "step"].forEach(k =>
        localStorage.removeItem(predKey(teamEntryId, k))
      );
    }

    setSaving(false);
    showToast("Team succesvol ingediend!", "success");
  }

  async function handleUnlock() {
    if (!teamEntryId) return;
    setUnlocking(true);
    const res = await fetch("/api/team/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamEntryId }),
    });
    if (res.ok) {
      setLocked(false);
      setStep(1);
    }
    setUnlocking(false);
  }

  async function handleSavePrediction() {
    if (!teamEntryId) return;
    setPredSaving(true);
    const res = await fetch("/api/team/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamEntryId,
        topScorerId: predTopScorerId || null,
        assistKoningId: predAssistKoningId || null,
        totalYellowCards: predYellowCards !== "" ? Number(predYellowCards) : null,
        totalGoals: predTotalGoals !== "" ? Number(predTotalGoals) : null,
      }),
    });
    setPredSaving(false);
    if (!res.ok) {
      const d = await res.json();
      showToast(d.error || "Opslaan mislukt", "error");
      return;
    }
    setHasPrediction(true);
    setShowPredictionModal(false);
    showToast("Team en voorspellingen succesvol ingediend!", "success");
  }

  async function handleDownloadImage() {
    const el = pitchRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mijn-team.png";
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setDownloading(false);
    }
  }


  async function handleShareCopy() {
    if (!teamEntryId) return;
    const url = `${window.location.origin}/team/${teamEntryId}`;
    await navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  }

  if (initError) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        {initError}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Team laden...
      </div>
    );
  }

  const activeSlot = selectedSlot !== null ? slots[selectedSlot] : null;
  const currentInSlot = activeSlot ? slotValues[activeSlot.slotIndex] : null;

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

  const chosenIds = new Set(slotValues.filter(Boolean) as string[]);

  // Geselecteerde spelers voor aanvoerderkeuze
  const selectedPlayers = slots
    .map((slot) => ({ slot, playerId: slotValues[slot.slotIndex] }))
    .filter((x) => x.playerId !== null) as { slot: SlotDef; playerId: string }[];

  // Stap-indicator
  const visibleSteps = captainEnabled ? [1, 2, 3, 4] : [1, 3, 4];
  const totalSteps = visibleSteps.length;
  const displayStep = visibleSteps.indexOf(step) + 1;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-10">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">
            Profcoach Rietmolen <span className="text-cyan-400">{season.name}</span>
          </h1>
        </div>

        {/* Formatie selector alleen in stap 1 */}
        {(!locked && !readOnly && step === 1) && (
          <select value={formationId} onChange={(e) => handleFormationChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40">
            {formations.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}
          </select>
        )}
        {(locked || readOnly) && (
          <select value={formationId} disabled
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm disabled:opacity-50 focus:outline-none">
            {formations.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}
          </select>
        )}

        <div className="flex gap-2 text-sm flex-wrap">
          <span className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300">
            {validation.selectedCount} / 11
          </span>
          <span className={`px-3 py-1 rounded-full border font-medium ${validation.totalValue > budget ? "bg-red-900/40 text-red-400 border-red-500/30" : "bg-green-900/40 text-green-400 border-green-500/30"}`}>
            €{validation.totalValue} / {budget}
          </span>
          {locked && <span className="bg-amber-900/40 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-bold">Ingediend</span>}
        </div>
      </div>

      {/* Deadline verstreken banner */}
      {readOnly && (
        <div className="mb-5 bg-amber-900/20 border border-amber-500/30 rounded-2xl px-5 py-4">
          <p className="text-amber-400 font-bold text-sm">Transfermarkt gesloten</p>
          <p className="text-slate-400 text-xs mt-0.5">De deadline was {deadline ? deadline.toLocaleString("nl-NL") : "verstreken"}. Je kunt je team alleen nog bekijken.</p>
        </div>
      )}

      {/* Team ingediend banner met tabs */}
      {locked && (
        <LockedTeamPanel
          hasPrediction={hasPrediction}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          downloading={downloading}
          onDownloadImage={handleDownloadImage}
          readOnly={readOnly}
          onUnlock={handleUnlock}
          unlocking={unlocking}
          onOpenPredictionModal={() => setShowPredictionModal(true)}
        />
      )}

      {/* Stap-indicator (alleen voor nieuwe invoer) */}
      {!locked && !readOnly && (
        <div className="mb-5 flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= displayStep ? "bg-cyan-500" : "bg-slate-700"}`} />
          ))}
          <span className="text-xs text-slate-500 shrink-0 ml-1">Stap {displayStep} / {totalSteps}</span>
        </div>
      )}

      {/* ── STAP 1: Spelerselectie ── */}
      {(locked || readOnly || step === 1) && (
        <Step1PlayerSelection
          locked={locked}
          readOnly={readOnly}
          step={step}
          stepOneValidation={stepOneValidation}
          hasMismatch={hasMismatch}
          slots={slots}
          selectedSlot={selectedSlot}
          playersById={playersById}
          slotValues={slotValues}
          onSlotClick={handleSlotClick}
          captainEnabled={captainEnabled}
          captainSlot={captainSlot}
          pitchRef={pitchRef}
          budget={budget}
          saving={saving}
          teamEntryId={teamEntryId}
          onSave={handleSave}
          teamValid={teamValid}
          goNext={goNext}
        />
      )}

      {/* ── STAP 2: Aanvoerder kiezen ── */}
      {!locked && !readOnly && step === 2 && captainEnabled && (
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

      {/* ── STAP 3: Voorspellingen + indienen ── */}
      {!locked && !readOnly && step === 3 && (
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
          goPrev={goPrev}
          goNext={goNext}
        />
      )}

      {/* ── STAP 4: Overzicht + indienen ── */}
      {!locked && !readOnly && step === 4 && (
        <Step4Overview
          pitchRef={pitchRef}
          slots={slots}
          playersById={playersById}
          slotValues={slotValues}
          captainEnabled={captainEnabled}
          captainSlot={captainSlot}
          formation={formation}
          players={players}
          predTopScorerId={predTopScorerId}
          predAssistKoningId={predAssistKoningId}
          predYellowCards={predYellowCards}
          predTotalGoals={predTotalGoals}
          goPrev={goPrev}
          onDownloadImage={handleDownloadImage}
          downloading={downloading}
          onFinalSubmit={handleFinalSubmit}
          saving={saving}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
          toast.type === "success" ? "bg-green-700 text-white border border-green-500/40" : "bg-red-800 text-white border border-red-500/40"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Voorspellingen modal (voor al ingediende teams zonder voorspelling) */}
      {showPredictionModal && (
        <PredictionModal
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
          predSaving={predSaving}
          onClose={() => { setShowPredictionModal(false); showToast("Voorspellingen overgeslagen.", "success"); }}
          onSkip={() => { setShowPredictionModal(false); showToast("Voorspellingen overgeslagen.", "success"); }}
          onSubmit={handleSavePrediction}
        />
      )}

      {/* Speler picker modal (stap 1) */}
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
        />
      )}
    </div>
  );
}
