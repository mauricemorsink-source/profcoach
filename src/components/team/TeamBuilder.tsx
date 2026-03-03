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
}

const DRAFT_KEY = "profcoach_draft_id";

const POSITION_LABEL: Record<string, string> = {
  GK: "Keeper", DEF: "Verdediger", MID: "Middenvelder", ATT: "Aanvaller",
};

export default function TeamBuilder({ formations, season, budget }: TeamBuilderProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamEntryId, setTeamEntryId] = useState<string | null>(null);
  const [formationId, setFormationId] = useState<string>(formations[0]?.id ?? "");
  const [slotValues, setSlotValues] = useState<(string | null)[]>(Array(11).fill(null));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [captainEnabled, setCaptainEnabled] = useState(false);
  const [captainSlot, setCaptainSlot] = useState<number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

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
      const [playersRes, draftRes] = await Promise.all([
        fetch("/api/players"),
        fetch("/api/team/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftId: localStorage.getItem(DRAFT_KEY) ?? undefined }),
        }),
      ]);

      const playersData = await playersRes.json();
      const draftData = await draftRes.json();

      setPlayers(playersData);

      const team = draftData.team;
      setTeamEntryId(team.id);
      setFormationId(team.formationId);
      setLocked(team.locked);
      setCaptainEnabled(draftData.captainEnabled ?? false);
      setCaptainSlot(team.captainSlot ?? null);
      localStorage.setItem(DRAFT_KEY, team.id);

      const restored = Array(11).fill(null);
      for (const tp of team.players) {
        restored[tp.slotIndex] = tp.playerId;
      }
      setSlotValues(restored);
      setLoading(false);
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
    // Captain slot resetten als de speler in dat slot verplaatst is
    setCaptainSlot(null);
  }

  function handleSlotClick(slotIndex: number) {
    if (locked) return;
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

  function handleSetCaptain() {
    if (selectedSlot === null) return;
    setCaptainSlot((prev) => (prev === selectedSlot ? null : selectedSlot));
    setShowPickerModal(false);
    setSelectedSlot(null);
  }

  async function handleSave() {
    if (!teamEntryId) return;
    setSaving(true);
    await fetch("/api/team/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamEntryId, formationId, slots: slotValues, captainSlot }),
    });
    setSaving(false);
  }

  async function handleSubmit() {
    if (!teamEntryId || !validation.allValid) return;
    setSaving(true);
    await handleSave();
    const res = await fetch("/api/team/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamEntryId }),
    });
    const data = await res.json();
    setLocked(data.team.locked);
    setSaving(false);
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
  const activeSlotIsCaptain = selectedSlot !== null && captainSlot === selectedSlot;

  const modalPlayers = activeSlot
    ? players
        .filter((p) => p.position === activeSlot.position)
        .filter((p) =>
          playerSearch.trim() === "" ||
          p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
          CLUB_LABEL[p.clubTeam]?.toLowerCase().includes(playerSearch.toLowerCase())
        )
    : [];

  const chosenIds = new Set(slotValues.filter(Boolean) as string[]);

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
          disabled={locked}
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

      {/* Regels checklist */}
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

      {/* Aanvoerder hint */}
      {captainEnabled && !locked && captainSlot === null && (
        <div className="mb-4 bg-amber-900/20 border border-amber-500/30 rounded-xl px-4 py-2.5 text-xs text-amber-400">
          Tik op een spelerskaart om een aanvoerder te kiezen.
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

      {/* Knoppen */}
      <div className="flex gap-3 mt-4 flex-wrap">
        <button
          onClick={handleSave}
          disabled={locked || saving || !teamEntryId}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-50 font-semibold text-sm border border-slate-700 transition-colors"
        >
          {saving ? "Bezig..." : "Opslaan"}
        </button>
        <button
          onClick={handleSubmit}
          disabled={locked || saving || !validation.allValid}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm"
        >
          {saving ? "Bezig..." : "Team indienen"}
        </button>
        {teamEntryId && (
          <button
            onClick={handleShareCopy}
            className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-sm border border-slate-700 transition-colors"
          >
            {copyFeedback ? "Link gekopieerd!" : "Delen"}
          </button>
        )}
      </div>

      {/* Player picker modal */}
      {showPickerModal && activeSlot && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 neon-border w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{activeSlot.label}</p>
                <h3 className="font-bold text-white">
                  Kies {POSITION_LABEL[activeSlot.position] ?? activeSlot.position}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Aanvoerder toggle — alleen als captainEnabled en er een speler in het slot zit */}
                {captainEnabled && currentInSlot && (
                  <button
                    onClick={handleSetCaptain}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-colors ${
                      activeSlotIsCaptain
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-400 hover:border-amber-500/40"
                    }`}
                  >
                    {activeSlotIsCaptain ? "C Aanvoerder" : "Aanvoerder"}
                  </button>
                )}
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
