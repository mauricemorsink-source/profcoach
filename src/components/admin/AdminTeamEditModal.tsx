"use client";

import { useState, useEffect, useMemo } from "react";
import { buildSlots } from "@/components/team/formationSlots";
import { CLUB_LABEL, validateTeam } from "@/components/team/validate";
import type { Formation, Player, SlotDef } from "@/components/team/types";

const SELECT = "flex-1 bg-slate-800 border text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-colors";
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700";

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
  return result;
}

interface Props {
  deelnemerId: string;
  deelnemerNaam: string;
  initialFormationId: string | null;
  initialSlots: (string | null)[];
  initialCaptainSlot: number | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AdminTeamEditModal({
  deelnemerId, deelnemerNaam, initialFormationId, initialSlots, initialCaptainSlot, onClose, onSaved,
}: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [budget, setBudget] = useState(1750);
  const [loading, setLoading] = useState(true);
  const [formationId, setFormationId] = useState(initialFormationId ?? "");
  const [slotValues, setSlotValues] = useState<(string | null)[]>(initialSlots);
  const [captainSlot, setCaptainSlot] = useState<number | null>(initialCaptainSlot);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/meta"), fetch("/api/players")])
      .then(async ([metaRes, playersRes]) => {
        const [meta, playerList] = await Promise.all([metaRes.json(), playersRes.json()]);
        setFormations(meta.formations ?? []);
        setPlayers(playerList);
        setBudget(meta.budget ?? 1750);
        if (!initialFormationId && meta.formations?.length) {
          setFormationId(meta.formations[0].id);
        }
        setLoading(false);
      });
  }, [initialFormationId]);

  const formation = useMemo(
    () => formations.find((f) => f.id === formationId) ?? formations[0],
    [formations, formationId]
  );
  const slots: SlotDef[] = useMemo(
    () => (formation ? buildSlots(formation) : []),
    [formation]
  );
  const playersById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players]
  );
  const byPosition = useMemo(() => {
    const map: Record<string, Player[]> = {};
    for (const p of players) {
      if (!map[p.position]) map[p.position] = [];
      map[p.position].push(p);
    }
    return map;
  }, [players]);

  function handleFormationChange(newId: string) {
    const newFormation = formations.find((f) => f.id === newId);
    if (!newFormation) return;
    setSlotValues(remapSlots(slotValues, buildSlots(newFormation), playersById));
    setFormationId(newId);
  }

  function handleSlotChange(slotIndex: number, newPlayerId: string) {
    const newSlots = [...slotValues];
    // Clear duplicate in other slots
    if (newPlayerId) {
      for (let i = 0; i < newSlots.length; i++) {
        if (i !== slotIndex && newSlots[i] === newPlayerId) newSlots[i] = null;
      }
    }
    newSlots[slotIndex] = newPlayerId || null;
    setSlotValues(newSlots);
  }

  const validation = useMemo(
    () => formation ? validateTeam(slotValues, playersById, formation, budget, false, null, slots) : null,
    [slotValues, playersById, formation, budget, slots]
  );
  const selectedCount = validation?.selectedCount ?? 0;

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/deelnemers/${deelnemerId}/team`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formationId, slots: slotValues, captainSlot }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Opslaan mislukt");
      return;
    }
    onSaved();
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
        <div className="bg-slate-900 neon-border rounded-2xl p-8 text-slate-400 text-sm">Spelers laden...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">Team bewerken</h3>
            <p className="text-xs text-slate-500">{deelnemerNaam}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
        </div>

        {/* Formatie */}
        <div className="mb-4">
          <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Formatie</label>
          <select
            value={formationId}
            onChange={(e) => handleFormationChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          >
            {formations.map((f) => (
              <option key={f.id} value={f.id}>{f.code}</option>
            ))}
          </select>
        </div>

        {/* Spelers per slot */}
        <div className="mb-4">
          <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
            Spelers ({selectedCount}/11)
          </label>
          <div className="space-y-1.5">
            {slots.map((slot) => {
              const currentId = slotValues[slot.slotIndex] ?? "";
              const positionPlayers = byPosition[slot.position] ?? [];
              const others = new Set(slotValues.filter((id, i) => id && i !== slot.slotIndex));
              const isCaptain = captainSlot === slot.slotIndex;

              return (
                <div key={slot.slotIndex} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 w-10 shrink-0 text-right">{slot.label}</span>
                  <select
                    value={currentId}
                    onChange={(e) => handleSlotChange(slot.slotIndex, e.target.value)}
                    className={`${SELECT} ${currentId ? "border-slate-700" : "border-amber-600/40"}`}
                  >
                    <option value="">— Kies speler —</option>
                    {positionPlayers.map((p) => (
                      <option key={p.id} value={p.id} disabled={others.has(p.id)}>
                        {p.name} · {CLUB_LABEL[p.clubTeam] ?? p.clubTeam}
                      </option>
                    ))}
                  </select>
                  {currentId && (
                    <button
                      type="button"
                      title="Aanvoerder"
                      onClick={() => setCaptainSlot(isCaptain ? null : slot.slotIndex)}
                      className={`text-xs px-2 py-1.5 rounded font-bold shrink-0 transition-colors ${
                        isCaptain
                          ? "bg-yellow-500 text-slate-900"
                          : "bg-slate-800 text-slate-500 hover:text-yellow-400 border border-slate-700"
                      }`}
                    >
                      C
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Validatiechecklist */}
        {validation && (
          <div className="mb-4 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-3">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Controle</p>
            <div className="space-y-1">
              {validation.rules.map((rule) => (
                <div key={rule.key} className="flex items-center justify-between text-xs">
                  <span className={rule.met ? "text-slate-400" : "text-red-400"}>{rule.label}</span>
                  <span className={`font-semibold ${rule.met ? "text-green-400" : "text-red-400"}`}>
                    {rule.met ? "✓" : "✗"} {rule.display}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className={BTN_SECONDARY}>Annuleer</button>
          <button onClick={save} disabled={saving || !validation?.allValid} className={BTN_PRIMARY}>
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}
