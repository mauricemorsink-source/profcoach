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
const POS_ORDER = ["GK", "DEF", "MID", "ATT"];

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
}

export default function KladopstellingClient({ formations, budget }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [formationId, setFormationId] = useState<string>(formations[0]?.id ?? "");
  const [slotValues, setSlotValues] = useState<(string | null)[]>(Array(11).fill(null));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");

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

  // Laad spelers + herstel localStorage
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

  // Persist naar localStorage bij elke wijziging
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
            Je kunt hier vrijblijvend experimenteren met je opstelling. Jouw kladopstelling wordt alleen in deze browser opgeslagen. Klaar? Dien je echte team in via <span className="text-slate-400">Mijn team</span>.
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
          <p className="text-slate-400 text-sm">
            De kladopstelling is alleen bedoeld om te puzzelen en experimenteren. Dien je echte team in via <span className="text-cyan-400 font-medium">Mijn team</span> — daar kun je je opstelling officieel inschrijven voor het spel.
          </p>
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
    </div>
  );
}
