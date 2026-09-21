"use client";

import { useState, useEffect } from "react";
import { utcIsoToLocalInput, localInputToUtcIso } from "@/lib/datetime";
import type { FlexConflict, GuestAppearance, PublishMoment, AdminMatch, EditPerfEntry } from "./wedstrijden/types";
import MatchesList, { type MenuPos } from "./wedstrijden/MatchesList";
import PublishMomentsPanel from "./wedstrijden/PublishMomentsPanel";
import EditMatchModal from "./wedstrijden/EditMatchModal";
import GuestPreviewModal from "./wedstrijden/GuestPreviewModal";
import ConflictModal from "./wedstrijden/ConflictModal";
import NewMomentModal from "./wedstrijden/NewMomentModal";

export default function WedstrijdenClient() {
  const [adminMatches, setAdminMatches] = useState<AdminMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [matchFilterTeam, setMatchFilterTeam] = useState("");
  const [matchFilterStatus, setMatchFilterStatus] = useState("");
  const [editingMatch, setEditingMatch] = useState<AdminMatch | null>(null);
  const [editMatchForm, setEditMatchForm] = useState({
    name: "",
    matchDate: "",
    thuisGoals: 0,
    uitGoals: 0,
    homeAway: "HOME",
    notes: "",
  });
  const [editMatchSaving, setEditMatchSaving] = useState(false);
  const [editMatchError, setEditMatchError] = useState("");
  const [matchMenuId, setMatchMenuId] = useState<string | null>(null);
  // Positie van het desktop "Acties"-dropdownpaneel, dat via een portal buiten de
  // horizontaal scrollende tabel wordt gerenderd zodat overflow-x-auto het niet afkapt.
  const [desktopMenuPos, setDesktopMenuPos] = useState<MenuPos | null>(null);

  useEffect(() => {
    if (!matchMenuId) return;
    // Sluit het menu bij scrollen (tabel of pagina) i.p.v. de vaste positie te laten
    // desynchroniseren met de knop waar het bij hoort.
    const close = () => setMatchMenuId(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [matchMenuId]);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
  const [revertingMatchId, setRevertingMatchId] = useState<string | null>(null);
  const [editPerfsData, setEditPerfsData] = useState<Record<string, EditPerfEntry>>({});

  // Publish moments
  const [publishMoments, setPublishMoments] = useState<PublishMoment[]>([]);
  const [newMomentModal, setNewMomentModal] = useState(false);
  const [newMomentForm, setNewMomentForm] = useState({ label: "", scheduledAt: "" });
  const [newMomentSaving, setNewMomentSaving] = useState(false);
  const [publishingMomentId, setPublishingMomentId] = useState<string | null>(null);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictModal, setConflictModal] = useState<{
    momentId: string;
    conflicts: FlexConflict[];
    selections: Record<string, Set<string>>;
  } | null>(null);
  const [deletingMomentId, setDeletingMomentId] = useState<string | null>(null);
  const [assignMomentMatchId, setAssignMomentMatchId] = useState<string | null>(null);
  const [showProcessedMoments, setShowProcessedMoments] = useState(false);

  const [pointsMsg, setPointsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [checkingGuests, setCheckingGuests] = useState(false);
  const [guestPreview, setGuestPreview] = useState<{ appearances: GuestAppearance[]; body: string | undefined } | null>(null);
  const [ambiguousResolutions, setAmbiguousResolutions] = useState<Record<string, Set<string>>>({});
  const [processSelectedIds, setProcessSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessingStuck, setIsProcessingStuck] = useState(false);
  const [resettingProcessing, setResettingProcessing] = useState(false);

  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [deleteSelectedIds, setDeleteSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState("");

  const [approveSelectedIds, setApproveSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkApproveError, setBulkApproveError] = useState("");

  async function loadAdminMatches() {
    setLoadingMatches(true);
    const res = await fetch("/api/admin/matches");
    if (res.ok) {
      const matches = await res.json();
      setAdminMatches(matches);
    }
    setLoadingMatches(false);
  }

  async function loadPublishMoments() {
    const res = await fetch("/api/admin/publish-moments");
    if (res.ok) setPublishMoments(await res.json());
  }

  async function resetProcessingLock() {
    setResettingProcessing(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetProcessing: true }),
    });
    setResettingProcessing(false);
    if (res.ok) setIsProcessingStuck(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- init-effect fetcht data en zet state, ongewijzigd t.o.v. het origineel; in het oorspronkelijke 2310-regelige bestand analyseerde de linter dit patroon niet (te groot voor volledige analyse), na het opsplitsen wel — geen gedragswijziging.
    loadAdminMatches();
    loadPublishMoments();
    fetch("/api/admin/settings").then(r => r.ok ? r.json() : null).then(s => {
      if (s?.isProcessing) setIsProcessingStuck(true);
    });
  }, []);

  const STATUS_SORT_ORDER: Record<string, number> = {
    APPROVED: 0, PENDING: 1, REJECTED: 2, PROCESSED: 3,
  };
  const filteredMatches = adminMatches
    .filter(
      (m) =>
        (!matchFilterTeam || m.clubTeam === matchFilterTeam) &&
        (!matchFilterStatus || m.status === matchFilterStatus)
    )
    .sort((a, b) => {
      const ao = STATUS_SORT_ORDER[a.status] ?? 5;
      const bo = STATUS_SORT_ORDER[b.status] ?? 5;
      if (ao !== bo) return ao - bo;
      return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
    });

  const editMatchReadOnly =
    !!editingMatch && editingMatch.status === "PROCESSED";

  function selectAllApproved() {
    const toProcess = adminMatches.filter((m) => m.status === "APPROVED");
    setProcessSelectedIds(new Set(toProcess.map((m) => m.id)));
  }

  function selectAllPending() {
    const toApprove = adminMatches.filter((m) => m.status === "PENDING");
    setApproveSelectedIds(new Set(toApprove.map((m) => m.id)));
  }

  function toggleApproveSelect(id: string) {
    setApproveSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAllApproveSelect() {
    const approvable = filteredMatches.filter((m) => m.status === "PENDING");
    const allSelected =
      approvable.length > 0 && approvable.every((m) => approveSelectedIds.has(m.id));
    setApproveSelectedIds(allSelected ? new Set() : new Set(approvable.map((m) => m.id)));
  }

  async function bulkApproveMatches(status: "APPROVED" | "REJECTED") {
    setBulkApproving(true);
    setBulkApproveError("");
    setPointsMsg(null);
    const res = await fetch("/api/admin/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(approveSelectedIds), status }),
    });
    const data = await res.json();
    setBulkApproving(false);
    if (!res.ok) { setBulkApproveError(data.error ?? "Bijwerken mislukt"); return; }
    setApproveSelectedIds(new Set());
    const verb = status === "APPROVED" ? "goedgekeurd" : "afgekeurd";
    setPointsMsg({ type: "ok", text: `${data.updated} wedstrijd${data.updated !== 1 ? "en" : ""} ${verb}` });
    await loadAdminMatches();
  }

  function toggleProcessSelect(id: string) {
    setProcessSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAllProcessSelect() {
    const processable = filteredMatches.filter((m) => m.status === "APPROVED");
    const allSelected =
      processable.length > 0 && processable.every((m) => processSelectedIds.has(m.id));
    setProcessSelectedIds(allSelected ? new Set() : new Set(processable.map((m) => m.id)));
  }

  function toggleBulkDeleteMode() {
    setBulkDeleteMode((v) => !v);
    setDeleteSelectedIds(new Set());
    setConfirmBulkDelete(false);
    setBulkDeleteError("");
    setProcessSelectedIds(new Set());
    setApproveSelectedIds(new Set());
  }

  function toggleDeleteSelect(id: string) {
    setDeleteSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAllDeleteSelect() {
    const allSelected = filteredMatches.length > 0 && filteredMatches.every((m) => deleteSelectedIds.has(m.id));
    setDeleteSelectedIds(allSelected ? new Set() : new Set(filteredMatches.map((m) => m.id)));
  }

  async function bulkDeleteMatches() {
    setBulkDeleting(true);
    setBulkDeleteError("");
    setPointsMsg(null);
    const res = await fetch("/api/admin/matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(deleteSelectedIds) }),
    });
    const data = await res.json();
    setBulkDeleting(false);
    if (!res.ok) { setBulkDeleteError(data.error ?? "Verwijderen mislukt"); return; }
    setDeleteSelectedIds(new Set());
    setConfirmBulkDelete(false);
    setBulkDeleteMode(false);
    if (data.playersReverted > 0) {
      setPointsMsg({ type: "ok", text: `${data.deleted} wedstrijden verwijderd, ${data.playersReverted} spelers bijgewerkt` });
    }
    await loadAdminMatches();
  }

  function updatePerfField(playerId: string, field: string, value: boolean | number) {
    setEditPerfsData((prev) => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }));
  }

  async function processPoints() {
    setPointsMsg(null);
    const body =
      processSelectedIds.size > 0
        ? JSON.stringify({ matchIds: Array.from(processSelectedIds) })
        : undefined;

    // Eerst checken welke spelers deze ronde bij twee elftallen speelden (gastspeler), zodat
    // we vóór het verwerken kunnen laten zien welke wedstrijd telt en welke niet.
    setCheckingGuests(true);
    const previewRes = await fetch("/api/admin/process-points/preview", {
      method: "POST",
      ...(body ? { headers: { "Content-Type": "application/json" }, body } : {}),
    });
    setCheckingGuests(false);
    if (previewRes.ok) {
      const previewData = await previewRes.json();
      const appearances: GuestAppearance[] = previewData.appearances ?? [];
      if (appearances.length > 0) {
        setGuestPreview({ appearances, body });
        setAmbiguousResolutions(
          Object.fromEntries(appearances.filter((a) => a.ambiguous).map((a) => [a.playerId, new Set<string>()]))
        );
        return;
      }
    }
    await doProcessPoints(body, []);
  }

  async function doProcessPoints(body: string | undefined, excludedPerformances: { matchId: string; playerId: string }[]) {
    setProcessing(true);
    const parsed = body ? JSON.parse(body) : {};
    const finalBody = JSON.stringify({ ...parsed, excludedPerformances });
    const res = await fetch("/api/admin/process-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: finalBody,
    });
    const data = await res.json();
    setProcessing(false);
    if (!res.ok) {
      if (res.status === 409 && data.error === "conflicts" && Array.isArray(data.conflicts)) {
        // Server is leidend: toon de actuele (mogelijk gewijzigde) conflicten opnieuw.
        const appearances: GuestAppearance[] = data.conflicts;
        setGuestPreview({ appearances, body });
        setAmbiguousResolutions(
          Object.fromEntries(appearances.filter((a) => a.ambiguous).map((a) => [a.playerId, new Set<string>()]))
        );
        return;
      }
      setPointsMsg({ type: "err", text: data.error || "Verwerking mislukt" });
      setGuestPreview(null);
    } else {
      setGuestPreview(null);
      setAmbiguousResolutions({});
      setProcessSelectedIds(new Set());
      const parts = [];
      if (data.processed > 0) parts.push(`${data.processed} wedstrijden verwerkt`);
      if (parts.length === 0) parts.push("Niets te verwerken");
      else parts.push(`${data.playersUpdated} spelers bijgewerkt`);
      setPointsMsg({ type: "ok", text: parts.join(", ") });
      await loadAdminMatches();
    }
  }

  async function revertMatch(id: string) {
    setMatchMenuId(null);
    setRevertingMatchId(id);
    setPointsMsg(null);
    const res = await fetch(`/api/admin/matches/${id}/revert`, { method: "POST" });
    const data = await res.json();
    setRevertingMatchId(null);
    if (!res.ok) {
      setPointsMsg({ type: "err", text: data.error || "Terugdraaien mislukt" });
    } else {
      setPointsMsg({
        type: "ok",
        text: `Wedstrijd teruggezet naar 'Goedgekeurd', ${data.playersReverted} spelers bijgewerkt`,
      });
      await loadAdminMatches();
    }
  }

  async function approveMatch(id: string, status: "APPROVED" | "REJECTED") {
    setApprovingId(id);
    await fetch(`/api/admin/matches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setApprovingId(null);
    await loadAdminMatches();
  }

  function openEditMatch(m: AdminMatch) {
    const thuisGoals = m.homeAway === "HOME" ? m.goalsScored : m.goalsConceded;
    const uitGoals = m.homeAway === "HOME" ? m.goalsConceded : m.goalsScored;
    setEditMatchForm({
      name: m.name,
      matchDate: utcIsoToLocalInput(m.matchDate),
      thuisGoals,
      uitGoals,
      homeAway: m.homeAway,
      notes: m.notes ?? "",
    });
    const data: Record<string, EditPerfEntry> = {};
    for (const p of m.performances) {
      data[p.playerId] = {
        played: p.played,
        goals: p.goals,
        penaltyGoals: p.penaltyGoals,
        assists: p.assists,
        ownGoals: p.ownGoals,
        yellowCards: p.yellowCards,
        redCard: p.redCard,
      };
    }
    setEditPerfsData(data);
    setEditMatchError("");
    setEditingMatch(m);
  }

  function closeEditMatch() {
    const id = editingMatch?.id;
    setEditingMatch(null);
    if (id)
      setTimeout(
        () => document.getElementById(`match-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
        50
      );
  }

  async function saveMatchAndPerfs(matchId: string): Promise<boolean> {
    const homeAway = editMatchForm.homeAway;
    const goalsScored = homeAway === "HOME" ? Number(editMatchForm.thuisGoals) : Number(editMatchForm.uitGoals);
    const goalsConceded = homeAway === "HOME" ? Number(editMatchForm.uitGoals) : Number(editMatchForm.thuisGoals);
    const res = await fetch(`/api/admin/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editMatchForm.name,
        matchDate: localInputToUtcIso(editMatchForm.matchDate),
        goalsScored,
        goalsConceded,
        homeAway,
        notes: editMatchForm.notes.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setEditMatchError(data.error || "Opslaan mislukt");
      return false;
    }
    const performances = Object.entries(editPerfsData).map(([playerId, d]) => ({ playerId, ...d }));
    if (performances.length > 0) {
      const perfRes = await fetch(`/api/admin/matches/${matchId}/performances`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performances }),
      });
      if (!perfRes.ok) {
        setEditMatchError("Prestaties opslaan mislukt");
        return false;
      }
    }
    return true;
  }

  async function saveAll() {
    if (!editingMatch) return;
    setEditMatchSaving(true);
    setEditMatchError("");
    const ok = await saveMatchAndPerfs(editingMatch.id);
    setEditMatchSaving(false);
    if (!ok) return;
    setEditingMatch(null);
    await loadAdminMatches();
  }

  async function approveFromModal(status: "APPROVED" | "REJECTED") {
    if (!editingMatch) return;
    const matchId = editingMatch.id;
    setEditMatchSaving(true);
    setEditMatchError("");
    const ok = await saveMatchAndPerfs(matchId);
    if (!ok) { setEditMatchSaving(false); return; }
    await fetch(`/api/admin/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setEditMatchSaving(false);
    setEditingMatch(null);
    await loadAdminMatches();
  }

  async function deleteMatch(id: string) {
    setDeletingMatchId(id);
    setMatchMenuId(null);
    setPointsMsg(null);
    const res = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    const data = await res.json();
    setDeletingMatchId(null);
    if (!res.ok) {
      setPointsMsg({ type: "err", text: data.error || "Verwijderen mislukt" });
      return;
    }
    if (data.playersReverted > 0) {
      setPointsMsg({ type: "ok", text: `Wedstrijd verwijderd, ${data.playersReverted} spelers bijgewerkt` });
    }
    await loadAdminMatches();
  }

  async function createMoment() {
    if (!newMomentForm.label || !newMomentForm.scheduledAt) return;
    setNewMomentSaving(true);
    const res = await fetch("/api/admin/publish-moments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newMomentForm.label,
        scheduledAt: localInputToUtcIso(newMomentForm.scheduledAt),
      }),
    });
    setNewMomentSaving(false);
    if (res.ok) {
      setNewMomentModal(false);
      setNewMomentForm({ label: "", scheduledAt: "" });
      await loadPublishMoments();
    }
  }

  async function deleteMoment(id: string) {
    setDeletingMomentId(id);
    const res = await fetch(`/api/admin/publish-moments/${id}`, { method: "DELETE" });
    setDeletingMomentId(null);
    if (res.ok) {
      await loadPublishMoments();
      await loadAdminMatches();
    }
  }

  async function doPublishMoment(
    momentId: string,
    excludedPerformances: { playerId: string; matchId: string }[],
    conflictsResolved = false
  ) {
    setPublishingMomentId(momentId);
    setPointsMsg(null);
    const res = await fetch(`/api/admin/publish-moments/${momentId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludedPerformances, conflictsResolved }),
    });
    const data = await res.json();
    setPublishingMomentId(null);
    if (res.status === 409 && data.error === "conflicts" && Array.isArray(data.conflicts)) {
      // Server detected unresolved conflicts — show the modal, preserve existing selections where possible
      const conflicts: FlexConflict[] = data.conflicts;
      const selections: Record<string, Set<string>> = {};
      setConflictModal((prev) => {
        for (const c of conflicts) {
          if (prev?.selections[c.playerId]) {
            selections[c.playerId] = prev.selections[c.playerId];
          } else {
            selections[c.playerId] = new Set();
          }
        }
        return { momentId, conflicts, selections };
      });
    } else if (!res.ok) {
      if (res.status === 409 && data.error?.includes("al bezig")) setIsProcessingStuck(true);
      setPointsMsg({ type: "err", text: data.error || "Publiceren mislukt" });
    } else {
      setPointsMsg({
        type: "ok",
        text: `Moment gepubliceerd: ${data.processed} wedstrijd${data.processed !== 1 ? "en" : ""} verwerkt, ${data.playersUpdated} spelers bijgewerkt`,
      });
      await loadPublishMoments();
      await loadAdminMatches();
    }
  }

  async function publishMoment(id: string) {
    setCheckingConflicts(true);
    setPointsMsg(null);
    const res = await fetch(`/api/admin/publish-moments/${id}/conflicts`);
    setCheckingConflicts(false);
    if (!res.ok) {
      setPointsMsg({ type: "err", text: "Kon conflicten niet controleren" });
      return;
    }
    const conflicts: FlexConflict[] = await res.json();
    if (conflicts.length === 0) {
      await doPublishMoment(id, []);
      return;
    }
    const selections: Record<string, Set<string>> = {};
    for (const c of conflicts) {
      selections[c.playerId] = new Set();
    }
    setConflictModal({ momentId: id, conflicts, selections });
  }

  function confirmPublishWithConflicts() {
    if (!conflictModal) return;
    const excludedPerformances: { playerId: string; matchId: string }[] = [];
    for (const conflict of conflictModal.conflicts) {
      const selected = conflictModal.selections[conflict.playerId];
      for (const match of conflict.matches) {
        if (!selected.has(match.matchId)) {
          excludedPerformances.push({ playerId: conflict.playerId, matchId: match.matchId });
        }
      }
    }
    setConflictModal(null);
    doPublishMoment(conflictModal.momentId, excludedPerformances, true);
  }

  async function assignToMoment(matchId: string, momentId: string | null) {
    setAssignMomentMatchId(null);
    await fetch(`/api/admin/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishMomentId: momentId }),
    });
    await loadAdminMatches();
    await loadPublishMoments();
  }

  return (
    <div className="flex gap-4 items-start">
      {/* Links: wedstrijdenoverzicht */}
      <MatchesList
        adminMatches={adminMatches}
        filteredMatches={filteredMatches}
        loadingMatches={loadingMatches}
        bulkDeleteMode={bulkDeleteMode}
        toggleBulkDeleteMode={toggleBulkDeleteMode}
        loadAdminMatches={loadAdminMatches}
        loadPublishMoments={loadPublishMoments}
        selectAllPending={selectAllPending}
        selectAllApproved={selectAllApproved}
        matchFilterTeam={matchFilterTeam}
        setMatchFilterTeam={setMatchFilterTeam}
        matchFilterStatus={matchFilterStatus}
        setMatchFilterStatus={setMatchFilterStatus}
        isProcessingStuck={isProcessingStuck}
        resetProcessingLock={resetProcessingLock}
        resettingProcessing={resettingProcessing}
        pointsMsg={pointsMsg}
        setPointsMsg={setPointsMsg}
        approveSelectedIds={approveSelectedIds}
        setApproveSelectedIds={setApproveSelectedIds}
        bulkApproveMatches={bulkApproveMatches}
        bulkApproving={bulkApproving}
        bulkApproveError={bulkApproveError}
        processSelectedIds={processSelectedIds}
        setProcessSelectedIds={setProcessSelectedIds}
        processPoints={processPoints}
        processing={processing}
        checkingGuests={checkingGuests}
        deleteSelectedIds={deleteSelectedIds}
        setDeleteSelectedIds={setDeleteSelectedIds}
        confirmBulkDelete={confirmBulkDelete}
        setConfirmBulkDelete={setConfirmBulkDelete}
        bulkDeleteMatches={bulkDeleteMatches}
        bulkDeleting={bulkDeleting}
        bulkDeleteError={bulkDeleteError}
        toggleDeleteSelect={toggleDeleteSelect}
        toggleProcessSelect={toggleProcessSelect}
        toggleApproveSelect={toggleApproveSelect}
        toggleAllDeleteSelect={toggleAllDeleteSelect}
        toggleAllProcessSelect={toggleAllProcessSelect}
        toggleAllApproveSelect={toggleAllApproveSelect}
        matchMenuId={matchMenuId}
        setMatchMenuId={setMatchMenuId}
        desktopMenuPos={desktopMenuPos}
        setDesktopMenuPos={setDesktopMenuPos}
        openEditMatch={openEditMatch}
        approveMatch={approveMatch}
        approvingId={approvingId}
        assignToMoment={assignToMoment}
        publishMoments={publishMoments}
        revertMatch={revertMatch}
        revertingMatchId={revertingMatchId}
        deleteMatch={deleteMatch}
        deletingMatchId={deletingMatchId}
      />

      {/* Rechts: Publicatieplanning (desktop only) */}
      <PublishMomentsPanel
        publishMoments={publishMoments}
        adminMatches={adminMatches}
        showProcessedMoments={showProcessedMoments}
        setShowProcessedMoments={setShowProcessedMoments}
        setNewMomentForm={setNewMomentForm}
        setNewMomentModal={setNewMomentModal}
        publishMoment={publishMoment}
        publishingMomentId={publishingMomentId}
        checkingConflicts={checkingConflicts}
        deleteMoment={deleteMoment}
        deletingMomentId={deletingMomentId}
      />

      {/* Backdrop: sluit dropdown menu bij klik buiten */}
      {matchMenuId && <div className="fixed inset-0 z-40" onClick={() => setMatchMenuId(null)} />}

      {/* Modal: wedstrijd bewerken / prestaties bekijken */}
      {editingMatch && (
        <EditMatchModal
          editingMatch={editingMatch}
          editMatchReadOnly={editMatchReadOnly}
          closeEditMatch={closeEditMatch}
          editMatchForm={editMatchForm}
          setEditMatchForm={setEditMatchForm}
          editMatchError={editMatchError}
          editPerfsData={editPerfsData}
          updatePerfField={updatePerfField}
          editMatchSaving={editMatchSaving}
          saveAll={saveAll}
          approveFromModal={approveFromModal}
        />
      )}

      {/* Modal: gastspeler-check (auto-opgelost + ambigu, met keuze) */}
      {guestPreview && (
        <GuestPreviewModal
          guestPreview={guestPreview}
          ambiguousResolutions={ambiguousResolutions}
          setAmbiguousResolutions={setAmbiguousResolutions}
          setGuestPreview={setGuestPreview}
          doProcessPoints={doProcessPoints}
          processing={processing}
        />
      )}

      {conflictModal && (
        <ConflictModal
          conflictModal={conflictModal}
          setConflictModal={setConflictModal}
          confirmPublishWithConflicts={confirmPublishWithConflicts}
        />
      )}

      {/* Modal: Nieuw publicatiemoment */}
      {newMomentModal && (
        <NewMomentModal
          newMomentForm={newMomentForm}
          setNewMomentForm={setNewMomentForm}
          setNewMomentModal={setNewMomentModal}
          createMoment={createMoment}
          newMomentSaving={newMomentSaving}
        />
      )}
    </div>
  );
}
