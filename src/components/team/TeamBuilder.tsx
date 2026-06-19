"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { Player, Formation, Season, SlotDef } from "./types";
import { buildSlots } from "./formationSlots";

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

import { validateTeam, CLUB_LABEL } from "./validate";
import Pitch from "./Pitch";

interface TeamBuilderProps {
  formations: Formation[];
  season: Season;
  budget: number;
  captainBonusPerWin?: number;
  readOnly?: boolean;
  deadline?: Date | null;
}

const DRAFT_KEY = "profcoach_draft_id";
const predKey = (id: string, field: string) => `profcoach_pred_${id}_${field}`;

const POSITION_LABEL: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};

const CLUB_ORDER = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];
const POS_ORDER = ["GK", "DEF", "MID", "ATT"];

const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700 disabled:opacity-50";

export default function TeamBuilder({ formations, season, budget, captainBonusPerWin = 5, readOnly = false, deadline }: TeamBuilderProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamEntryId, setTeamEntryId] = useState<string | null>(null);
  const [formationId, setFormationId] = useState<string>(formations[0]?.id ?? "");
  const [slotValues, setSlotValues] = useState<(string | null)[]>(Array(11).fill(null));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Helper: speler picker voor voorspellingen
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
        {/* Transparante overlay om buiten-klik te vangen */}
        {isOpen && (
          <div className="fixed inset-0 z-[45]" onClick={() => { setPredActiveField(null); setPredSearch(""); }} />
        )}

        {/* Trigger knop — blijft altijd op dezelfde plek */}
        <button
          onClick={() => { setPredActiveField(isOpen ? null : field); setPredSearch(""); }}
          className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors relative z-[46] ${
            value ? "border-cyan-500/40 bg-cyan-500/10 text-white" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
          }`}
        >
          {value ? (players.find(p => p.id === value)?.name ?? "Gekozen") : "Kies een speler..."}
        </button>

        {/* Floating dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-[47] mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-slate-800">
              <input autoFocus type="text" placeholder="Zoek op naam of elftal..." value={predSearch}
                onChange={(e) => setPredSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40" />
            </div>
            <div className="overflow-y-auto max-h-[352px]">
              {filteredPlayers.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Geen spelers gevonden</p>
              ) : filteredPlayers.map(p => (
                <button key={p.id}
                  onClick={() => { onSelect(p.id); setPredActiveField(null); setPredSearch(""); }}
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

      {/* Team ingediend banner */}
      {locked && (
        <div className="mb-5 bg-green-900/20 border border-green-500/30 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-green-400 font-bold text-sm">Team ingediend</p>
            <p className="text-slate-400 text-xs mt-0.5">{hasPrediction ? "Voorspellingen ingediend." : "Vul ook je bonusvoorspellingen in."}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!hasPrediction && !readOnly && (
              <button onClick={() => setShowPredictionModal(true)} className={BTN_PRIMARY + " shrink-0"}>Voorspellingen invullen</button>
            )}
            <button onClick={handleDownloadImage} disabled={downloading} className={BTN_SECONDARY + " shrink-0"}>
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="shrink-0">
                  <path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {downloading ? "Laden..." : "Download opstelling"}
              </span>
            </button>
            {!readOnly && (
              <button onClick={handleUnlock} disabled={unlocking} className={BTN_SECONDARY + " shrink-0"}>
                {unlocking ? "Bezig..." : "Terugtrekken"}
              </button>
            )}
          </div>
        </div>
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
        <>
          {/* Regels checklist */}
          {!locked && !readOnly && step === 1 && (() => {
            const v = validateTeam(slotValues, playersById, formation, budget, false, null, slots);
            const hasMismatch = v.rules.some(r => r.key === "positions" && !r.met);
            return (
              <div className={`mb-5 rounded-2xl border p-4 transition-colors ${v.allValid ? "bg-green-900/15 border-green-500/30" : "bg-red-900/15 border-red-500/20"}`}>
                {hasMismatch && (
                  <div className="flex items-start gap-2 mb-3 bg-red-900/30 border border-red-500/40 rounded-xl px-3 py-2.5">
                    <span className="text-red-400 text-base shrink-0 mt-0.5">⚠</span>
                    <p className="text-red-300 text-xs font-medium">
                      Eén of meer spelers staan op een verkeerde positie door een formatiewijziging. Pas de opstelling aan of kies een andere formatie.
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

          <div ref={pitchRef}>
            <Pitch slots={slots} selectedSlot={selectedSlot} playersById={playersById} slotValues={slotValues}
              onSlotClick={handleSlotClick} locked={locked || readOnly || step !== 1} captainSlot={captainEnabled ? captainSlot : null} />
          </div>

          {!locked && !readOnly && step === 1 && (() => {
            const v = validateTeam(slotValues, playersById, formation, budget, false, null, slots);
            const errors = v.rules
              .filter(r => !r.met)
              .map(r => {
                if (r.key === "positions") return "Eén of meer spelers staan op een verkeerde positie — pas de opstelling of formatie aan.";
                if (r.key === "spelers") return `Selecteer precies 11 spelers (nu ${v.selectedCount}).`;
                if (r.key === "budget") return `Budget overschreden: €${v.totalValue} van €${budget}.`;
                if (r.key.startsWith("club_")) {
                  const club = r.key.replace("club_", "");
                  const count = v.countsByClub[club] ?? 0;
                  if (count < 1) return `Minimaal 1 speler vereist uit ${r.label}.`;
                  if (count > 2) return `Maximaal 2 spelers uit ${r.label} (nu ${count}).`;
                }
                return null;
              })
              .filter(Boolean) as string[];

            return (
              <div className="mt-4 space-y-3">
                {errors.length > 0 && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 space-y-1">
                    {errors.map((e, i) => (
                      <p key={i} className="text-red-400 text-xs flex items-start gap-2">
                        <span className="shrink-0 mt-0.5">✗</span>
                        <span>{e}</span>
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 flex-wrap">
                  <button onClick={handleSave} disabled={saving || !teamEntryId} className={BTN_SECONDARY}>
                    {saving ? "Bezig..." : "Concept opslaan"}
                  </button>
                  <button onClick={goNext} disabled={!teamValid} className={BTN_PRIMARY + " ml-auto"}>
                    Volgende stap →
                  </button>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* ── STAP 2: Aanvoerder kiezen ── */}
      {!locked && !readOnly && step === 2 && captainEnabled && (
        <>
          <div className="bg-slate-900 neon-border rounded-2xl p-5">
            <p className="text-base font-bold text-white mb-1">Kies je aanvoerder</p>
            <p className="text-slate-400 text-sm mb-5">
              Kies je aanvoerder van jouw team en maak kans op extra punten gedurende het seizoen: jouw aanvoerder ontvangt dit seizoen voor iedere overwinning <span className="text-amber-400 font-bold">{captainBonusPerWin} extra punten</span>!
            </p>
            <div className="space-y-2">
              {selectedPlayers.map(({ slot, playerId }) => {
                const player = playersById[playerId];
                if (!player) return null;
                const isCaptain = captainSlot === slot.slotIndex;
                return (
                  <button key={playerId} onClick={() => setCaptainSlot(isCaptain ? null : slot.slotIndex)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${
                      isCaptain
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-400"
                    }`}>
                    <div className="flex items-center gap-3">
                      {isCaptain
                        ? <span className="w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center text-xs font-black text-amber-400">C</span>
                        : <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-500">C</span>
                      }
                      <span>{player.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">{POSITION_LABEL[player.position] ?? player.position}</span>
                  </button>
                );
              })}
            </div>
            {captainSlot === null && <p className="text-xs text-amber-400/70 mt-3">Nog geen aanvoerder gekozen — kies een speler hierboven</p>}
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={goPrev} className={BTN_SECONDARY}>← Vorige</button>
            <button onClick={goNext} className={BTN_PRIMARY + " ml-auto"}>Volgende stap →</button>
          </div>
        </>
      )}

      {/* ── STAP 3: Voorspellingen + indienen ── */}
      {!locked && !readOnly && step === 3 && (
        <>
          <div className="bg-slate-900 neon-border rounded-2xl p-5 space-y-5">
            <div>
              <p className="text-base font-bold text-white mb-1">Bonusvoorspellingen</p>
              <p className="text-slate-400 text-sm">Vul jouw voorspellingen in voor bonuspunten aan het einde van het seizoen. Dit kan na het indienen niet meer worden gewijzigd.</p>
              <p className="text-slate-500 text-xs mt-1">De topscorer en assistkoning hoeven niet in jouw eigen team te zitten — je kiest uit alle spelers in het spel.</p>
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
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                Totaal doelpunten VV Rietmolen (dit seizoen) {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.totalGoalsPoints} pt)</span>}
              </label>
              <p className="text-xs text-slate-600 mb-1.5">Incl. eigen goals tegenstanders en spelers buiten het spel (jeugdspelers, nieuwe spelers etc.)</p>
              <input type="number" min="0" value={predTotalGoals} onChange={(e) => setPredTotalGoals(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={goPrev} className={BTN_SECONDARY}>← Vorige</button>
            <button onClick={goNext} className={BTN_PRIMARY + " ml-auto"}>Bekijk overzicht →</button>
          </div>
        </>
      )}

      {/* ── STAP 4: Overzicht + indienen ── */}
      {!locked && !readOnly && step === 4 && (
        <>
          <div ref={pitchRef}>
            <Pitch slots={slots} selectedSlot={null} playersById={playersById} slotValues={slotValues}
              onSlotClick={() => {}} locked captainSlot={captainEnabled ? captainSlot : null} />
          </div>

          <div className="bg-slate-900 neon-border rounded-2xl p-5 space-y-5 mt-4">
            <div>
              <p className="text-base font-bold text-white mb-0.5">Controleer je inschrijving</p>
              <p className="text-slate-500 text-xs">Kijk alles na en dien je team in. Dit kan daarna niet meer worden gewijzigd.</p>
            </div>

            {/* Team overzicht */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Jouw team</p>
                <span className="text-xs text-slate-600">{formation?.code}</span>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-sm">
                <thead>
                  <tr className="text-left text-slate-600 border-b border-slate-800">
                    <th className="pb-1.5 font-semibold">Naam</th>
                    <th className="pb-1.5 font-semibold">Pos.</th>
                    <th className="pb-1.5 font-semibold">Elftal</th>
                  </tr>
                </thead>
                <tbody>
                  {slots
                    .filter(s => slotValues[s.slotIndex])
                    .sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position))
                    .map(s => {
                      const player = playersById[slotValues[s.slotIndex]!];
                      if (!player) return null;
                      const isCaptain = captainEnabled && captainSlot === s.slotIndex;
                      return (
                        <tr key={s.slotIndex} className="border-b border-slate-800/40">
                          <td className="py-1.5 text-slate-200">
                            {player.name}
                            {isCaptain && <span className="ml-1.5 text-amber-400 font-bold text-xs">C</span>}
                          </td>
                          <td className="py-1.5 text-slate-500 text-xs">{POSITION_LABEL[s.position] ?? s.position}</td>
                          <td className="py-1.5 text-slate-500 text-xs">{CLUB_LABEL[player.clubTeam] ?? player.clubTeam}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              </div>
            </div>

            {/* Voorspellingen */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Voorspellingen</p>
              <div className="space-y-1.5">
                {[
                  { label: "Topscorer", value: predTopScorerId ? (players.find(p => p.id === predTopScorerId)?.name ?? "—") : "—" },
                  { label: "Assistkoning", value: predAssistKoningId ? (players.find(p => p.id === predAssistKoningId)?.name ?? "—") : "—" },
                  { label: "Gele kaarten", value: predYellowCards !== "" ? predYellowCards : "—" },
                  { label: "Totaal doelpunten", value: predTotalGoals !== "" ? predTotalGoals : "—" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{row.label}</span>
                    <span className={`font-medium ${row.value === "—" ? "text-slate-600" : "text-white"}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4 flex-wrap">
            <button onClick={goPrev} className={BTN_SECONDARY}>← Vorige</button>
            <button onClick={handleDownloadImage} disabled={downloading} className={BTN_SECONDARY}>
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="shrink-0">
                  <path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {downloading ? "Laden..." : "Download opstelling"}
              </span>
            </button>
            <button onClick={handleFinalSubmit} disabled={saving} className={BTN_PRIMARY + " ml-auto"}>
              {saving ? "Bezig..." : "Team indienen"}
            </button>
          </div>
        </>
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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 neon-border w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Bonusvraag</p>
                <h3 className="font-bold text-white">Jouw voorspellingen</h3>
              </div>
              <button onClick={() => { setShowPredictionModal(false); showToast("Voorspellingen overgeslagen.", "success"); }}
                className="text-slate-500 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center transition-colors">×</button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              <p className="text-slate-400 text-sm">Dit kan na het indienen van je team niet meer worden gewijzigd.</p>
              <p className="text-slate-500 text-xs">De topscorer en assistkoning hoeven niet in jouw eigen team te zitten — je kiest uit alle spelers in het spel.</p>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Topscorer {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.topScorerPoints} pt)</span>}</label>
                <PredPlayerPicker field="topscorer" value={predTopScorerId} onSelect={setPredTopScorerId} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Assistkoning {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.assistKoningPoints} pt)</span>}</label>
                <PredPlayerPicker field="assistkoning" value={predAssistKoningId} onSelect={setPredAssistKoningId} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Totaal gele kaarten (dit seizoen) {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.yellowCardsPoints} pt)</span>}</label>
                <input type="number" min="0" value={predYellowCards} onChange={(e) => setPredYellowCards(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Totaal doelpunten VV Rietmolen (dit seizoen) {predPointsConfig?.showPointsToParticipants && <span className="text-cyan-400 normal-case font-normal ml-1">({predPointsConfig.totalGoalsPoints} pt)</span>}</label>
                <p className="text-xs text-slate-600 mb-1.5">Incl. eigen goals tegenstanders en spelers buiten het spel (jeugdspelers, nieuwe spelers etc.)</p>
                <input type="number" min="0" value={predTotalGoals} onChange={(e) => setPredTotalGoals(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
              </div>
            </div>
            <div className="px-5 pb-5 pt-3 shrink-0 border-t border-slate-800 flex gap-3">
              <button onClick={() => { setShowPredictionModal(false); showToast("Voorspellingen overgeslagen.", "success"); }} className={BTN_SECONDARY}>Overslaan</button>
              <button onClick={handleSavePrediction} disabled={predSaving || (!predTopScorerId && !predAssistKoningId && predYellowCards === "" && predTotalGoals === "")} className={BTN_PRIMARY + " flex-1"}>
                {predSaving ? "Opslaan..." : "Voorspellingen indienen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Speler picker modal (stap 1) */}
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
                  <button onClick={handleClearSlot} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-500/30 transition-colors">Leegmaken</button>
                )}
                <button onClick={() => { setShowPickerModal(false); setSelectedSlot(null); }}
                  className="text-slate-500 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center transition-colors">×</button>
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
              {modalPlayers.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Geen spelers gevonden.</p>
              ) : (
                modalPlayers.map((player) => {
                  const isInThisSlot = currentInSlot === player.id;
                  const isElsewhere = chosenIds.has(player.id) && !isInThisSlot;
                  return (
                    <div key={player.id} onClick={() => handleSelectPlayer(player.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isInThisSlot ? "border-cyan-500/50 bg-cyan-500/10" : isElsewhere ? "border-slate-800 bg-slate-800/30 opacity-50" : "border-slate-800 bg-slate-800/30 hover:border-cyan-500/40 hover:bg-slate-800"
                      }`}>
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
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
