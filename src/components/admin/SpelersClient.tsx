"use client";

import { useState, useEffect } from "react";
import type { Player, PlayerForm, ImportResult, PlayerStats } from "./spelers/types";
import { emptyForm } from "./spelers/constants";
import PlayersList from "./spelers/PlayersList";
import ImportPlayers from "./spelers/ImportPlayers";
import PlayerFormModal from "./spelers/PlayerFormModal";
import PlayerStatsModal from "./spelers/PlayerStatsModal";

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
      <PlayersList
        players={players}
        loadingPlayers={loadingPlayers}
        filterName={filterName}
        setFilterName={setFilterName}
        filterTeam={filterTeam}
        setFilterTeam={setFilterTeam}
        filterPosition={filterPosition}
        setFilterPosition={setFilterPosition}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        toggleSelectAll={toggleSelectAll}
        confirmBulk={confirmBulk}
        setConfirmBulk={setConfirmBulk}
        bulkDelete={bulkDelete}
        bulkDeleting={bulkDeleting}
        setSelectedIds={setSelectedIds}
        onOpenAdd={openAdd}
        onOpenPlayerStats={openPlayerStats}
      />

      <ImportPlayers
        importFile={importFile}
        setImportFile={setImportFile}
        handleImport={handleImport}
        importing={importing}
        importResult={importResult}
      />

      {/* Modal: speler toevoegen / bewerken */}
      {modal && (
        <PlayerFormModal
          modal={modal}
          editingPlayer={editingPlayer}
          form={form}
          setForm={setForm}
          formTouched={formTouched}
          setFormTouched={setFormTouched}
          formError={formError}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={savePlayer}
        />
      )}

      {/* Modal: Speler statistieken */}
      {playerStatsModal && (
        <PlayerStatsModal
          playerStatsModal={playerStatsModal}
          playerStats={playerStats}
          loadingPlayerStats={loadingPlayerStats}
          onClose={() => setPlayerStatsModal(null)}
          onEdit={openEdit}
          confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId}
          deletingId={deletingId}
          onDelete={deletePlayer}
        />
      )}
    </div>
  );
}
