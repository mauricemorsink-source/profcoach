"use client";

import { useState, useEffect } from "react";

type Player = {
  id: string;
  name: string;
  shortName?: string | null;
  position: "GK" | "DEF" | "MID" | "ATT";
  clubTeam: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE" | "DAMES";
  altTeam?: string | null;
  value: number;
  hasPlayedMatch: boolean;
};

type PlayerForm = {
  name: string;
  shortName: string;
  position: string;
  clubTeam: string;
  altTeam: string;
  value: string;
};

type ImportResult = {
  imported: number;
  alreadyPresent: number;
  skipped: number;
  errors: string[];
};

type PlayerStatPerf = {
  matchId: string;
  matchName: string;
  matchDate: string;
  clubTeam: string;
  homeAway: string;
  goalsScored: number;
  goalsConceded: number;
  played: boolean;
  goals: number;
  penaltyGoals: number;
  assists: number;
  ownGoals: number;
  yellowCards: number;
  redCard: boolean;
  cleanSheet: boolean;
  won: boolean;
  drew: boolean;
  points: number;
  breakdown: Record<string, number>;
};

type PlayerStats = {
  player: Player;
  seasonStats: {
    totalPoints: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    cleanSheets: number;
    wins: number;
    draws: number;
    matchesPlayed: number;
  } | null;
  performances: PlayerStatPerf[];
};

const POSITIONS = ["GK", "DEF", "MID", "ATT"];
const TEAMS = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];

const POSITION_LABEL: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};

const POSITION_SHORT: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};

const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

const emptyForm: PlayerForm = { name: "", shortName: "", position: "GK", clubTeam: "ONE", altTeam: "", value: "" };

const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const LABEL = "block text-sm font-medium text-slate-400 mb-1";
const SELECT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700";
const BTN_DANGER = "px-3 py-2 text-xs bg-red-900/40 text-red-400 rounded hover:bg-red-900/60 font-medium border border-red-500/30 transition-colors";
const BTN_SMALL = "px-3 py-2 text-xs bg-slate-800 text-slate-400 rounded hover:bg-slate-700 font-medium border border-slate-700 transition-colors";

export default function SpelersClient() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [form, setForm] = useState<PlayerForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [formTouched, setFormTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  // Player stats modal
  const [playerStatsModal, setPlayerStatsModal] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loadingPlayerStats, setLoadingPlayerStats] = useState(false);

  async function loadPlayers() {
    setLoadingPlayers(true);
    const res = await fetch("/api/admin/players");
    const data = await res.json();
    setPlayers(data);
    setLoadingPlayers(false);
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  const filteredPlayers = players.filter((p) => {
    if (filterName && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterTeam && p.clubTeam !== filterTeam) return false;
    if (filterPosition && p.position !== filterPosition) return false;
    return true;
  });

  function openAdd() {
    setForm(emptyForm);
    setFormError("");
    setFormTouched(false);
    setEditingPlayer(null);
    setModal("add");
  }

  function openEdit(player: Player) {
    setForm({
      name: player.name,
      shortName: player.shortName ?? "",
      position: player.position,
      clubTeam: player.clubTeam,
      altTeam: player.altTeam ?? "",
      value: player.value.toString(),
    });
    setFormError("");
    setFormTouched(false);
    setEditingPlayer(player);
    setModal("edit");
  }

  async function savePlayer() {
    setSaving(true);
    setFormError("");
    const url = modal === "edit" ? `/api/admin/players/${editingPlayer!.id}` : "/api/admin/players";
    const method = modal === "edit" ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, value: Number(form.value) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error || "Er is een fout opgetreden");
      setSaving(false);
      return;
    }
    setModal(null);
    await loadPlayers();
    setSaving(false);
  }

  async function deletePlayer(id: string) {
    setDeletingId(id);
    await fetch(`/api/admin/players/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setConfirmDeleteId(null);
    await loadPlayers();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const allSelected = filteredPlayers.every((p) => selectedIds.has(p.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredPlayers.forEach((p) => (allSelected ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  }

  async function bulkDelete() {
    setBulkDeleting(true);
    await fetch("/api/admin/players", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    setSelectedIds(new Set());
    setConfirmBulk(false);
    setBulkDeleting(false);
    await loadPlayers();
  }

  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", importFile);
    const res = await fetch("/api/admin/import-players", { method: "POST", body: formData });
    setImportResult(await res.json());
    setImporting(false);
    await loadPlayers();
  }

  async function openPlayerStats(player: Player) {
    setPlayerStatsModal(player);
    setPlayerStats(null);
    setLoadingPlayerStats(true);
    const res = await fetch(`/api/admin/players/${player.id}/stats`);
    if (res.ok) setPlayerStats(await res.json());
    setLoadingPlayerStats(false);
  }

  return (
    <div className="max-w-4xl space-y-5">
      <section className="bg-slate-900 neon-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Spelersbeheer</h2>
          <button onClick={openAdd} className={BTN_PRIMARY}>
            + Nieuwe speler
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Zoek op naam..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-44 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          />
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          >
            <option value="">Alle elftallen</option>
            {TEAMS.map((t) => (
              <option key={t} value={t}>
                {TEAM_LABEL[t]}
              </option>
            ))}
          </select>
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          >
            <option value="">Alle posities</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {POSITION_LABEL[p]}
              </option>
            ))}
          </select>
          {(filterName || filterTeam || filterPosition) && (
            <button
              onClick={() => {
                setFilterName("");
                setFilterTeam("");
                setFilterPosition("");
              }}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Wis filters
            </button>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 px-3 py-2.5 bg-red-900/20 border border-red-500/30 rounded-lg">
            <span className="text-sm font-medium text-red-400">
              {selectedIds.size} speler{selectedIds.size !== 1 ? "s" : ""} geselecteerd
            </span>
            <div className="flex-1 hidden sm:block" />
            {confirmBulk ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-red-400">Zeker weten?</span>
                <button onClick={bulkDelete} disabled={bulkDeleting} className={BTN_DANGER + " disabled:opacity-50"}>
                  {bulkDeleting ? "Bezig..." : "Ja, verwijder"}
                </button>
                <button onClick={() => setConfirmBulk(false)} className={BTN_SMALL}>
                  Annuleer
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setConfirmBulk(true)} className={BTN_DANGER}>
                  Verwijder selectie
                </button>
                <button onClick={() => setSelectedIds(new Set())} className={BTN_SMALL}>
                  Deselecteer
                </button>
              </div>
            )}
          </div>
        )}

        {loadingPlayers ? (
          <p className="text-slate-500 text-sm py-4">Laden...</p>
        ) : filteredPlayers.length === 0 ? (
          <div className="py-6 text-center">
            {players.length === 0 ? (
              <>
                <p className="text-slate-500 text-sm mb-3">Nog geen spelers toegevoegd.</p>
                <button onClick={openAdd} className={BTN_PRIMARY}>
                  + Eerste speler toevoegen
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-500 text-sm mb-2">Geen spelers gevonden voor deze filters.</p>
                <button
                  onClick={() => {
                    setFilterName("");
                    setFilterTeam("");
                    setFilterPosition("");
                  }}
                  className={BTN_SMALL}
                >
                  Filters wissen
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800">
                  <th className="pb-2 pr-3 w-8">
                    <input
                      type="checkbox"
                      checked={filteredPlayers.length > 0 && filteredPlayers.every((p) => selectedIds.has(p.id))}
                      ref={(el) => {
                        if (el)
                          el.indeterminate =
                            filteredPlayers.some((p) => selectedIds.has(p.id)) &&
                            !filteredPlayers.every((p) => selectedIds.has(p.id));
                      }}
                      onChange={toggleSelectAll}
                      className="rounded accent-cyan-500"
                    />
                  </th>
                  <th className="pb-2 font-semibold">Naam</th>
                  <th className="pb-2 font-semibold">Pos</th>
                  <th className="pb-2 font-semibold hidden sm:table-cell">Elftal</th>
                  <th className="pb-2 font-semibold">Waarde</th>
                  <th className="pb-2 font-semibold text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr
                    key={player.id}
                    className={`border-b border-slate-800/60 ${
                      selectedIds.has(player.id) ? "bg-red-900/10" : "hover:bg-slate-800/30"
                    }`}
                  >
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(player.id)}
                        onChange={() => toggleSelect(player.id)}
                        className="rounded accent-cyan-500"
                      />
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-white">{player.name}</span>
                        {player.altTeam && (
                          <span className="text-[9px] font-bold text-violet-400 bg-violet-900/30 border border-violet-500/30 px-1 py-0.5 rounded shrink-0">
                            FLEX
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 sm:hidden">
                        {TEAM_LABEL[player.clubTeam]}
                        {player.altTeam && (
                          <span className="text-violet-400"> → {TEAM_LABEL[player.altTeam]}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-slate-400">{POSITION_SHORT[player.position]}</td>
                    <td className="py-2 text-slate-400 hidden sm:table-cell">
                      {TEAM_LABEL[player.clubTeam]}
                      {player.altTeam && (
                        <span className="text-violet-400 text-xs"> → {TEAM_LABEL[player.altTeam]}</span>
                      )}
                    </td>
                    <td className="py-2 text-slate-400">€{player.value}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => openPlayerStats(player)} className={BTN_SMALL}>
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-600 mt-2">
              {filteredPlayers.length} van {players.length} spelers
              {selectedIds.size > 0 && ` · ${selectedIds.size} geselecteerd`}
            </p>
          </div>
        )}
      </section>

      <section className="bg-slate-900 neon-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">Spelers importeren via Excel</h2>
        <p className="text-slate-500 text-sm mb-4">
          Upload een .xlsx bestand met kolommen: Naam, Positie (GK/DEF/MID/ATT), Team
          (ONE/TWO/THREE/FOUR/FIVE/DAMES), Waarde.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 file:transition-colors"
          />
          <button onClick={handleImport} disabled={!importFile || importing} className={BTN_PRIMARY}>
            {importing ? "Bezig..." : "Importeren"}
          </button>
        </div>
        {importResult && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="font-semibold text-slate-300 mb-2 text-sm">Resultaat</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-green-900/40 text-green-400 px-3 py-1 rounded-full text-xs border border-green-500/30">
                {importResult.imported} toegevoegd
              </span>
              {importResult.alreadyPresent > 0 && (
                <span className="bg-blue-900/40 text-blue-400 px-3 py-1 rounded-full text-xs border border-blue-500/30">
                  {importResult.alreadyPresent} al aanwezig
                </span>
              )}
              {importResult.skipped > 0 && (
                <span className="bg-amber-900/40 text-amber-400 px-3 py-1 rounded-full text-xs border border-amber-500/30">
                  {importResult.skipped} overgeslagen
                </span>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30">
                <p className="font-semibold text-red-400 text-sm mb-1">Fouten:</p>
                <ul className="list-disc list-inside text-sm text-red-400/80 space-y-0.5">
                  {importResult.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal: speler toevoegen / bewerken */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              {modal === "add" ? "Nieuwe speler toevoegen" : "Speler bewerken"}
            </h3>
            {modal === "edit" && editingPlayer?.hasPlayedMatch && (
              <p className="text-xs text-amber-400/90 bg-amber-900/20 border border-amber-500/30 rounded-lg px-3 py-2 mb-4">
                Let op: deze speler heeft al een wedstrijd gespeeld. Het wijzigen van positie of elftal
                werkt niet met terugwerkende kracht — al verwerkte wedstrijden blijven meetellen met de
                oude positie/elftal totdat ze eventueel worden teruggedraaid of verwijderd, en gebruiken
                dan de nieuwe waarde. Wijzig dit alleen om een fout te corrigeren, niet voor een
                seizoenstransfer.
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Naam</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setFormTouched(true);
                  }}
                  className={INPUT + (formTouched && !form.name.trim() ? " border-red-500/60" : "")}
                  placeholder="Voornaam Achternaam"
                />
                {formTouched && !form.name.trim() && (
                  <p className="text-xs text-red-400 mt-1">Naam is verplicht.</p>
                )}
              </div>
              <div>
                <label className={LABEL}>
                  Weergavenaam op veld <span className="text-slate-600 font-normal">(optioneel)</span>
                </label>
                <input
                  type="text"
                  value={form.shortName}
                  onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                  className={INPUT}
                  placeholder="bijv. J. de Vries"
                />
                <p className="text-xs text-slate-600 mt-1">
                  Wordt getoond op het voetbalveld. Laat leeg om de volledige naam te gebruiken.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Positie</label>
                  <select
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className={SELECT}
                  >
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {POSITION_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Elftal</label>
                  <select
                    value={form.clubTeam}
                    onChange={(e) => setForm({ ...form, clubTeam: e.target.value })}
                    className={SELECT}
                  >
                    {TEAMS.map((t) => (
                      <option key={t} value={t}>
                        {TEAM_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>
                  FLEX-team <span className="text-slate-500 font-normal">(speelt standaard in ander team)</span>
                </label>
                <select
                  value={form.altTeam}
                  onChange={(e) => setForm({ ...form, altTeam: e.target.value })}
                  className={SELECT}
                >
                  <option value="">— Geen (speler speelt in eigen team) —</option>
                  {TEAMS.filter((t) => t !== form.clubTeam).map((t) => (
                    <option key={t} value={t}>
                      {TEAM_LABEL[t]}
                    </option>
                  ))}
                </select>
                {form.altTeam && (
                  <p className="text-xs text-amber-400/80 mt-1">
                    Speler verschijnt standaard in de wedstrijdinvoer van {TEAM_LABEL[form.altTeam]}. Puntentelling
                    blijft op {TEAM_LABEL[form.clubTeam]}.
                  </p>
                )}
              </div>
              <div>
                <label className={LABEL}>Waarde</label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => {
                    setForm({ ...form, value: e.target.value });
                    setFormTouched(true);
                  }}
                  className={
                    INPUT +
                    (formTouched && (form.value === "" || Number(form.value) <= 0) ? " border-red-500/60" : "")
                  }
                  placeholder="bv. 120"
                  min="1"
                />
                {formTouched && (form.value === "" || Number(form.value) <= 0) && (
                  <p className="text-xs text-red-400 mt-1">Vul een geldige waarde in (groter dan 0).</p>
                )}
              </div>
              {formError && (
                <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">
                  {formError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(null)} className={BTN_SECONDARY}>
                Annuleer
              </button>
              <button
                onClick={savePlayer}
                disabled={saving || !form.name.trim() || !form.value || Number(form.value) <= 0}
                className={BTN_PRIMARY}
              >
                {saving ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Speler statistieken */}
      {playerStatsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between p-6 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">{playerStatsModal.name}</h3>
                <p className="text-sm text-slate-500">
                  {POSITION_LABEL[playerStatsModal.position]} · {TEAM_LABEL[playerStatsModal.clubTeam]}
                </p>
              </div>
              <button
                onClick={() => setPlayerStatsModal(null)}
                className="text-slate-500 hover:text-slate-300 text-xl leading-none mt-0.5"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5">
              {loadingPlayerStats ? (
                <p className="text-slate-500 text-sm text-center py-8">Laden...</p>
              ) : !playerStats ? (
                <p className="text-slate-500 text-sm text-center py-8">Geen data beschikbaar.</p>
              ) : (
                <>
                  {/* Seizoen totalen */}
                  {playerStats.seasonStats && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                        Seizoen totaal
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {[
                          { label: "Punten", value: playerStats.seasonStats.totalPoints, highlight: true },
                          { label: "Wedstrijden", value: playerStats.seasonStats.matchesPlayed },
                          { label: "Goals", value: playerStats.seasonStats.goals },
                          { label: "Assists", value: playerStats.seasonStats.assists },
                          { label: "Gewonnen", value: playerStats.seasonStats.wins },
                          { label: "Gelijkspel", value: playerStats.seasonStats.draws },
                          { label: "Gele kaarten", value: playerStats.seasonStats.yellowCards },
                          { label: "Rode kaarten", value: playerStats.seasonStats.redCards },
                          ...(["GK", "DEF"].includes(playerStatsModal.position)
                            ? [{ label: "Clean sheets", value: playerStats.seasonStats.cleanSheets }]
                            : []),
                        ].map((s) => (
                          <div
                            key={s.label}
                            className={`rounded-xl p-3 text-center border ${
                              s.highlight
                                ? "bg-cyan-900/20 border-cyan-500/30"
                                : "bg-slate-800/50 border-slate-700"
                            }`}
                          >
                            <p className={`text-lg font-bold ${s.highlight ? "text-cyan-400" : "text-white"}`}>
                              {s.value}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per wedstrijd */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                      Per verwerkte wedstrijd
                    </p>
                    {playerStats.performances.length === 0 ? (
                      <p className="text-slate-500 text-sm">Nog geen verwerkte wedstrijden.</p>
                    ) : (
                      <div className="space-y-2">
                        {playerStats.performances.map((p) => (
                          <div
                            key={p.matchId}
                            className={`rounded-xl border p-3 ${
                              !p.played ? "border-slate-800 opacity-50" : "border-slate-700 bg-slate-800/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <p className="font-medium text-white text-sm">
                                  {TEAM_LABEL[p.clubTeam] ?? p.clubTeam} {p.homeAway === "HOME" ? "vs" : "@"}{" "}
                                  {p.matchName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(p.matchDate).toLocaleDateString("nl-NL", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                  {" · "}
                                  {p.homeAway === "AWAY"
                                    ? `${p.goalsConceded}–${p.goalsScored}`
                                    : `${p.goalsScored}–${p.goalsConceded}`}
                                  {" · "}
                                  {p.played
                                    ? p.won
                                      ? "Gewonnen"
                                      : p.drew
                                      ? "Gelijkspel"
                                      : "Verloren"
                                    : "Niet gespeeld"}
                                </p>
                              </div>
                              <span
                                className={`text-lg font-black shrink-0 ${
                                  p.points > 0
                                    ? "text-cyan-400"
                                    : p.points < 0
                                    ? "text-red-400"
                                    : "text-slate-500"
                                }`}
                              >
                                {p.points > 0 ? "+" : ""}
                                {p.points}
                              </span>
                            </div>
                            {p.played && Object.keys(p.breakdown).length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(p.breakdown).map(([label, pts]) => (
                                  <span
                                    key={label}
                                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                      pts > 0
                                        ? "bg-green-900/20 border-green-500/20 text-green-400"
                                        : "bg-red-900/20 border-red-500/20 text-red-400"
                                    }`}
                                  >
                                    {label}: {pts > 0 ? "+" : ""}
                                    {pts}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 shrink-0 flex items-center gap-3">
              <button onClick={() => setPlayerStatsModal(null)} className={BTN_SECONDARY}>
                Sluiten
              </button>
              <button
                onClick={() => {
                  const p = playerStatsModal;
                  setPlayerStatsModal(null);
                  openEdit(p!);
                }}
                className={BTN_PRIMARY}
              >
                Bewerken
              </button>
              <div className="ml-auto">
                {confirmDeleteId === playerStatsModal.id ? (
                  <span className="flex items-center gap-2">
                    <span className="text-sm text-red-400">Zeker weten?</span>
                    <button
                      onClick={() => {
                        deletePlayer(playerStatsModal.id);
                        setPlayerStatsModal(null);
                      }}
                      disabled={deletingId === playerStatsModal.id}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      {deletingId === playerStatsModal.id ? "..." : "Ja"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Nee
                    </button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDeleteId(playerStatsModal.id)} className={BTN_DANGER}>
                    Verwijderen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
