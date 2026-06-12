"use client";

import { useState, useEffect, useMemo } from "react";
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
  readOnly?: boolean;
  deadline?: Date | null;
}

const DRAFT_KEY = "profcoach_draft_id";

const POSITION_LABEL: Record<string, string> = {
  GK: "Keeper", DEF: "Verdediger", MID: "Middenvelder", ATT: "Aanvaller",
};

const CLUB_ORDER = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];
const POS_ORDER = ["GK", "DEF", "MID", "ATT"];

const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700 disabled:opacity-50";

export default function TeamBuilder({ formations, season, budget, readOnly = false, deadline }: TeamBuilderProps) {
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

  const formation = formations.find((f) => f.id === formationId) ?? formations[0];
  const slots: SlotDef[] = useMemo(() => buildSlots(formation), [formation]);

  const playersById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players]
  );

  const validation = useMemo(
    () => validateTeam(slotValues, playersById, formation, budget, captainEnabled, captainSlot),
    [slotValues, playersById, formation, budget, captainEnabled, captainSlot]
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
      setLoading(false);

      // Als team al ingediend is maar nog geen voorspelling ingevuld: modal direct tonen
      // (niet in readOnly mode want dan is de deadline verstreken)
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

  async function handleSubmit() {
    if (!teamEntryId || !validation.allValid) return;
    setSaving(true);
    const saved = await handleSave();
    if (!saved) return;
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
    setSaving(false);
    setShowPredictionModal(true);
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

  return (
    <div className="max-w-3xl mx-auto px-4 pb-10">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">
            Profcoach Rietmolen <span className="text-cyan-400">{season.name}</span>
          </h1>
        </div>

        <select
          value={formationId}
          onChange={(e) => handleFormationChange(e.target.value)}
          disabled={locked || readOnly}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
        >
          {formations.map((f) => (
            <option key={f.id} value={f.id}>{f.code}</option>
          ))}
        </select>

        <div className="flex gap-2 text-sm flex-wrap">
          <span className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300">
            {validation.selectedCount} / 11
          </span>
          <span className={`px-3 py-1 rounded-full border font-medium ${
            validation.totalValue > budget
              ? "bg-red-900/40 text-red-400 border-red-500/30"
              : "bg-green-900/40 text-green-400 border-green-500/30"
          }`}>
            €{validation.totalValue} / {budget}
          </span>
          {locked && (
            <span className="bg-amber-900/40 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-bold">
              Ingediend
            </span>
          )}
        </div>
      </div>

      {/* Deadline verstreken banner */}
      {readOnly && (
        <div className="mb-5 bg-amber-900/20 border border-amber-500/30 rounded-2xl px-5 py-4">
          <p className="text-amber-400 font-bold text-sm">Transfermarkt gesloten</p>
          <p className="text-slate-400 text-xs mt-0.5">
            De deadline was {deadline ? deadline.toLocaleString("nl-NL") : "verstreken"}. Je kunt je team alleen nog bekijken.
          </p>
        </div>
      )}

      {/* Regels checklist */}
      {!locked && !readOnly && (
        <div className={`mb-5 rounded-2xl border p-4 transition-colors ${
          validation.allValid
            ? "bg-green-900/15 border-green-500/30"
            : "bg-red-900/15 border-red-500/20"
        }`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
            {validation.rules.map((rule) => (
              <div key={rule.key} className="flex items-center gap-1.5 text-xs">
                <span className={rule.met ? "text-green-400" : "text-red-400"}>
                  {rule.met ? "✓" : "✗"}
                </span>
                <span className="text-slate-400 truncate">{rule.label}:</span>
                <span className={`font-bold shrink-0 ${rule.met ? "text-green-400" : "text-red-400"}`}>
                  {rule.display}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team ingediend banner */}
      {locked && (
        <div className="mb-5 bg-green-900/20 border border-green-500/30 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-green-400 font-bold text-sm">Team ingediend</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {hasPrediction ? "Voorspellingen ingediend." : "Vul hieronder ook je bonusvoorspellingen in."}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {!hasPrediction && !readOnly && (
              <button
                onClick={() => setShowPredictionModal(true)}
                className={BTN_PRIMARY + " shrink-0"}
              >
                Voorspellingen invullen
              </button>
            )}
            {!readOnly && (
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className={BTN_SECONDARY + " shrink-0"}
              >
                {unlocking ? "Bezig..." : "Terugtrekken"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Veld */}
      <Pitch
        slots={slots}
        selectedSlot={selectedSlot}
        playersById={playersById}
        slotValues={slotValues}
        onSlotClick={handleSlotClick}
        locked={locked}
        captainSlot={captainEnabled ? captainSlot : null}
      />

      {/* Aanvoerder selectie */}
      {captainEnabled && !locked && !readOnly && selectedPlayers.length > 0 && (
        <div className="mt-4 bg-slate-900 neon-border rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Aanvoerder kiezen</p>
          <div className="flex flex-wrap gap-2">
            {selectedPlayers.map(({ slot, playerId }) => {
              const player = playersById[playerId];
              if (!player) return null;
              const isCaptain = captainSlot === slot.slotIndex;
              return (
                <button
                  key={playerId}
                  onClick={() => setCaptainSlot(isCaptain ? null : slot.slotIndex)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition-colors ${
                    isCaptain
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-400"
                  }`}
                >
                  {isCaptain && <span className="text-xs font-black">C</span>}
                  <span>{player.shortName ?? player.name}</span>
                </button>
              );
            })}
          </div>
          {captainSlot === null && (
            <p className="text-xs text-amber-400/70 mt-2">Nog geen aanvoerder gekozen</p>
          )}
        </div>
      )}

      {/* Knoppen */}
      {!readOnly && (
        <div className="flex gap-3 mt-4 flex-wrap">
          <button
            onClick={handleSave}
            disabled={locked || saving || !teamEntryId}
            className={BTN_SECONDARY}
          >
            {saving ? "Bezig..." : "Opslaan"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={locked || saving || !validation.allValid}
            className={BTN_PRIMARY}
          >
            {saving ? "Bezig..." : "Team indienen"}
          </button>
          {teamEntryId && (
            <button
              onClick={handleShareCopy}
              className={BTN_SECONDARY + " ml-auto"}
            >
              {copyFeedback ? "Link gekopieerd!" : "Delen"}
            </button>
          )}
        </div>
      )}

      {/* Toast melding */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
          toast.type === "success"
            ? "bg-green-700 text-white border border-green-500/40"
            : "bg-red-800 text-white border border-red-500/40"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Voorspellingen modal */}
      {showPredictionModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 neon-border w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Bonusvraag</p>
                <h3 className="font-bold text-white">Jouw voorspellingen</h3>
              </div>
              <button onClick={() => { setShowPredictionModal(false); showToast("Team ingediend! Voorspellingen overgeslagen.", "success"); }} className="text-slate-500 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center transition-colors">×</button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              <p className="text-slate-400 text-sm">Vul jouw voorspellingen in voor bonuspunten aan het einde van het seizoen. Dit kan na het indienen van je team niet meer worden gewijzigd.</p>
              <p className="text-slate-500 text-xs">De topscorer en assistkoning hoeven niet in jouw eigen team te zitten — je kiest uit alle spelers in het spel.</p>

              {/* Topscorer */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                  Topscorer
                  {predPointsConfig?.showPointsToParticipants && <span className="ml-2 text-cyan-400 normal-case font-normal">({predPointsConfig.topScorerPoints} pt)</span>}
                </label>
                {predActiveField === "topscorer" ? (
                  <div className="space-y-1.5">
                    <input autoFocus type="text" placeholder="Zoek speler..." value={predSearch} onChange={(e) => setPredSearch(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-slate-800 bg-slate-800/50">
                      {players.filter(p => !predSearch.trim() || p.name.toLowerCase().includes(predSearch.toLowerCase()) || CLUB_LABEL[p.clubTeam]?.toLowerCase().includes(predSearch.toLowerCase())).slice(0, 30).map(p => (
                        <button key={p.id} onClick={() => { setPredTopScorerId(p.id); setPredActiveField(null); setPredSearch(""); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center justify-between ${predTopScorerId === p.id ? "text-cyan-400" : "text-white"}`}>
                          <span>{p.name}</span>
                          <span className="text-slate-500 text-xs">{CLUB_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => { setPredActiveField(null); setPredSearch(""); }} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Annuleer</button>
                  </div>
                ) : (
                  <button onClick={() => { setPredActiveField("topscorer"); setPredSearch(""); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${predTopScorerId ? "border-cyan-500/40 bg-cyan-500/10 text-white" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"}`}>
                    {predTopScorerId ? (players.find(p => p.id === predTopScorerId)?.name ?? "Gekozen") : "Kies een speler..."}
                  </button>
                )}
              </div>

              {/* Assistkoning */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                  Assistkoning
                  {predPointsConfig?.showPointsToParticipants && <span className="ml-2 text-cyan-400 normal-case font-normal">({predPointsConfig.assistKoningPoints} pt)</span>}
                </label>
                {predActiveField === "assistkoning" ? (
                  <div className="space-y-1.5">
                    <input autoFocus type="text" placeholder="Zoek speler..." value={predSearch} onChange={(e) => setPredSearch(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-slate-800 bg-slate-800/50">
                      {players.filter(p => !predSearch.trim() || p.name.toLowerCase().includes(predSearch.toLowerCase()) || CLUB_LABEL[p.clubTeam]?.toLowerCase().includes(predSearch.toLowerCase())).slice(0, 30).map(p => (
                        <button key={p.id} onClick={() => { setPredAssistKoningId(p.id); setPredActiveField(null); setPredSearch(""); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center justify-between ${predAssistKoningId === p.id ? "text-cyan-400" : "text-white"}`}>
                          <span>{p.name}</span>
                          <span className="text-slate-500 text-xs">{CLUB_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => { setPredActiveField(null); setPredSearch(""); }} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Annuleer</button>
                  </div>
                ) : (
                  <button onClick={() => { setPredActiveField("assistkoning"); setPredSearch(""); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${predAssistKoningId ? "border-cyan-500/40 bg-cyan-500/10 text-white" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"}`}>
                    {predAssistKoningId ? (players.find(p => p.id === predAssistKoningId)?.name ?? "Gekozen") : "Kies een speler..."}
                  </button>
                )}
              </div>

              {/* Gele kaarten */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                  Totaal gele kaarten (dit seizoen)
                  {predPointsConfig?.showPointsToParticipants && <span className="ml-2 text-cyan-400 normal-case font-normal">({predPointsConfig.yellowCardsPoints} pt)</span>}
                </label>
                <input type="number" min="0" value={predYellowCards} onChange={(e) => setPredYellowCards(e.target.value)}
                  placeholder="bv. 47"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
              </div>

              {/* Totaal doelpunten */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                  Totaal doelpunten VV Rietmolen (dit seizoen)
                  {predPointsConfig?.showPointsToParticipants && <span className="ml-2 text-cyan-400 normal-case font-normal">({predPointsConfig.totalGoalsPoints} pt)</span>}
                </label>
                <p className="text-xs text-slate-600 mb-1.5">Incl. eigen goals tegenstanders en spelers buiten het spel (jeugdspelers, nieuwe spelers etc.)</p>
                <input type="number" min="0" value={predTotalGoals} onChange={(e) => setPredTotalGoals(e.target.value)}
                  placeholder="bv. 120"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 shrink-0 border-t border-slate-800 flex gap-3">
              <button onClick={() => { setShowPredictionModal(false); showToast("Team ingediend!", "success"); }} className={BTN_SECONDARY}>Overslaan</button>
              <button onClick={handleSavePrediction} disabled={predSaving || (!predTopScorerId && !predAssistKoningId && predYellowCards === "" && predTotalGoals === "")} className={BTN_PRIMARY + " flex-1"}>
                {predSaving ? "Opslaan..." : "Voorspellingen indienen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player picker modal */}
      {showPickerModal && activeSlot && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 neon-border w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85dvh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{activeSlot.label}</p>
                <h3 className="font-bold text-white">
                  Kies {POSITION_LABEL[activeSlot.position] ?? activeSlot.position}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {currentInSlot && (
                  <button
                    onClick={handleClearSlot}
                    className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-500/30 transition-colors"
                  >
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

            {/* Zoekbalk */}
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

            {/* Spelerslijst */}
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
    </div>
  );
}
