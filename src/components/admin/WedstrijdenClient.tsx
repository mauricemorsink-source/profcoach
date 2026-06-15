"use client";

import { useState, useEffect } from "react";

type FlexConflict = {
  playerId: string;
  player: { name: string; position: string; clubTeam: string; altTeam: string | null };
  matches: {
    matchId: string;
    matchName: string;
    matchDate: string;
    matchClubTeam: string;
    isOriginalTeam: boolean;
    goals: number;
    penaltyGoals: number;
    assists: number;
    ownGoals: number;
    yellowCards: number;
    redCard: boolean;
    points: number;
  }[];
};

type PublishMoment = {
  id: string;
  label: string;
  scheduledAt: string;
  publishedAt: string | null;
  matches: { id: string; status: string }[];
};

type AdminMatch = {
  id: string;
  name: string;
  clubTeam: string;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  matchDate: string;
  goalsScored: number;
  goalsConceded: number;
  extraScorers: { goals: number; description: string }[] | null;
  notes: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED" | "CORRECTION";
  publishMomentId: string | null;
  publishMoment: { id: string; label: string; scheduledAt: string; publishedAt: string | null } | null;
  createdBy: { name: string | null; email: string } | null;
  performances: {
    playerId: string;
    played: boolean;
    goals: number;
    penaltyGoals: number;
    assists: number;
    ownGoals: number;
    yellowCards: number;
    redCard: boolean;
    player: { name: string; position: string; clubTeam: string };
  }[];
};

const TEAMS = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];

const POSITION_LABEL: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};

const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Ingediend",
  APPROVED: "Goedgekeurd",
  REJECTED: "Afgekeurd",
  PROCESSED: "Verwerkt",
  CORRECTION: "Correctie",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-900/40 text-amber-400 border border-amber-500/30",
  APPROVED: "bg-green-900/40 text-green-400 border border-green-500/30",
  REJECTED: "bg-red-900/40 text-red-400 border border-red-500/30",
  PROCESSED: "bg-blue-900/40 text-blue-400 border border-blue-500/30",
  CORRECTION: "bg-orange-900/40 text-orange-400 border border-orange-500/30",
};

const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const LABEL = "block text-sm font-medium text-slate-400 mb-1";
const SELECT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700";
const BTN_SMALL = "px-3 py-1.5 text-xs bg-slate-800 text-slate-400 rounded hover:bg-slate-700 font-medium border border-slate-700 transition-colors";

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
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
  const [revertingMatchId, setRevertingMatchId] = useState<string | null>(null);
  const [editPerfsData, setEditPerfsData] = useState<
    Record<
      string,
      {
        played: boolean;
        goals: number;
        penaltyGoals: number;
        assists: number;
        ownGoals: number;
        yellowCards: number;
        redCard: boolean;
      }
    >
  >({});

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
  const [processSelectedIds, setProcessSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessingStuck, setIsProcessingStuck] = useState(false);
  const [resettingProcessing, setResettingProcessing] = useState(false);

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
    loadAdminMatches();
    loadPublishMoments();
    fetch("/api/admin/settings").then(r => r.ok ? r.json() : null).then(s => {
      if (s?.isProcessing) setIsProcessingStuck(true);
    });
  }, []);

  const STATUS_SORT_ORDER: Record<string, number> = {
    APPROVED: 0, CORRECTION: 1, PENDING: 2, REJECTED: 3, PROCESSED: 4,
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
    !!editingMatch && (editingMatch.status === "PROCESSED" || editingMatch.status === "CORRECTION");

  function selectAllApproved() {
    const toProcess = adminMatches.filter((m) => m.status === "APPROVED" || m.status === "CORRECTION");
    setProcessSelectedIds(new Set(toProcess.map((m) => m.id)));
  }

  function toggleProcessSelect(id: string) {
    setProcessSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAllProcessSelect() {
    const processable = filteredMatches.filter((m) => m.status === "APPROVED" || m.status === "CORRECTION");
    const allSelected =
      processable.length > 0 && processable.every((m) => processSelectedIds.has(m.id));
    setProcessSelectedIds(allSelected ? new Set() : new Set(processable.map((m) => m.id)));
  }

  function updatePerfField(playerId: string, field: string, value: boolean | number) {
    setEditPerfsData((prev) => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }));
  }

  async function processPoints() {
    setProcessing(true);
    setPointsMsg(null);
    const body =
      processSelectedIds.size > 0
        ? JSON.stringify({ matchIds: Array.from(processSelectedIds) })
        : undefined;
    const res = await fetch("/api/admin/process-points", {
      method: "POST",
      ...(body ? { headers: { "Content-Type": "application/json" }, body } : {}),
    });
    const data = await res.json();
    setProcessing(false);
    if (!res.ok) {
      setPointsMsg({ type: "err", text: data.error || "Verwerking mislukt" });
    } else {
      setProcessSelectedIds(new Set());
      const parts = [];
      if (data.processed > 0) parts.push(`${data.processed} wedstrijden verwerkt`);
      if (data.reversed > 0) parts.push(`${data.reversed} correcties teruggedraaid`);
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

  async function cancelCorrection(id: string) {
    await fetch(`/api/admin/matches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PROCESSED" }),
    });
    await loadAdminMatches();
  }

  function openEditMatch(m: AdminMatch) {
    const thuisGoals = m.homeAway === "HOME" ? m.goalsScored : m.goalsConceded;
    const uitGoals = m.homeAway === "HOME" ? m.goalsConceded : m.goalsScored;
    setEditMatchForm({
      name: m.name,
      matchDate: m.matchDate.slice(0, 16),
      thuisGoals,
      uitGoals,
      homeAway: m.homeAway,
      notes: m.notes ?? "",
    });
    const data: Record<
      string,
      {
        played: boolean;
        goals: number;
        penaltyGoals: number;
        assists: number;
        ownGoals: number;
        yellowCards: number;
        redCard: boolean;
      }
    > = {};
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

  async function saveAll() {
    if (!editingMatch) return;
    setEditMatchSaving(true);
    setEditMatchError("");
    const homeAway = editMatchForm.homeAway;
    const goalsScored = homeAway === "HOME" ? Number(editMatchForm.thuisGoals) : Number(editMatchForm.uitGoals);
    const goalsConceded = homeAway === "HOME" ? Number(editMatchForm.uitGoals) : Number(editMatchForm.thuisGoals);
    const res = await fetch(`/api/admin/matches/${editingMatch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editMatchForm.name,
        matchDate: editMatchForm.matchDate,
        goalsScored,
        goalsConceded,
        homeAway,
        notes: editMatchForm.notes.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setEditMatchSaving(false);
      setEditMatchError(data.error || "Opslaan mislukt");
      return;
    }
    const performances = Object.entries(editPerfsData).map(([playerId, d]) => ({ playerId, ...d }));
    if (performances.length > 0) {
      const perfRes = await fetch(`/api/admin/matches/${editingMatch.id}/performances`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performances }),
      });
      if (!perfRes.ok) {
        setEditMatchSaving(false);
        setEditMatchError("Prestaties opslaan mislukt");
        return;
      }
    }
    setEditMatchSaving(false);
    setEditingMatch(null);
    await loadAdminMatches();
  }

  async function deleteMatch(id: string) {
    setDeletingMatchId(id);
    setMatchMenuId(null);
    const res = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    setDeletingMatchId(null);
    if (res.ok) await loadAdminMatches();
  }

  async function createMoment() {
    if (!newMomentForm.label || !newMomentForm.scheduledAt) return;
    setNewMomentSaving(true);
    const res = await fetch("/api/admin/publish-moments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMomentForm),
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
            selections[c.playerId] = new Set(c.matches.map((m) => m.matchId));
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
      selections[c.playerId] = new Set(c.matches.map((m) => m.matchId));
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
      <section className="bg-slate-900 neon-border rounded-2xl p-6 flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Wedstrijden</h2>
          <button
            onClick={() => {
              loadAdminMatches();
              loadPublishMoments();
            }}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Vernieuwen
          </button>
        </div>

        {/* Wachtrij banner */}
        {(() => {
          const waiting = adminMatches.filter((m) => m.status === "APPROVED" || m.status === "CORRECTION");
          if (waiting.length === 0) return null;
          const oldest = waiting.reduce((a, b) =>
            new Date(a.matchDate) < new Date(b.matchDate) ? a : b
          );
          const days = Math.floor((Date.now() - new Date(oldest.matchDate).getTime()) / 86400000);
          const urgent = days >= 7;
          return (
            <div
              className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 border text-sm flex-wrap ${
                urgent
                  ? "bg-amber-900/20 border-amber-500/30 text-amber-300"
                  : "bg-cyan-900/20 border-cyan-500/30 text-cyan-300"
              }`}
            >
              <span className="flex-1">
                <span className="font-semibold">
                  {waiting.length} wedstrijd{waiting.length !== 1 ? "en" : ""}
                </span>{" "}
                wacht{waiting.length === 1 ? "" : "en"} op verwerking
                {urgent && (
                  <span className="ml-2 text-amber-400 font-medium">
                    · oudste al {days} dagen geleden gespeeld
                  </span>
                )}
              </span>
              <button
                onClick={selectAllApproved}
                className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors"
              >
                Selecteer alle ({waiting.length})
              </button>
            </div>
          );
        })()}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={matchFilterTeam}
            onChange={(e) => setMatchFilterTeam(e.target.value)}
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
            value={matchFilterStatus}
            onChange={(e) => setMatchFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          >
            <option value="">Alle statussen</option>
            <option value="PENDING">Ingediend</option>
            <option value="APPROVED">Goedgekeurd</option>
            <option value="REJECTED">Afgekeurd</option>
            <option value="PROCESSED">Verwerkt</option>
            <option value="CORRECTION">Correctie</option>
          </select>
          {(matchFilterTeam || matchFilterStatus) && (
            <button
              onClick={() => {
                setMatchFilterTeam("");
                setMatchFilterStatus("");
              }}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Wis filters
            </button>
          )}
        </div>

        {/* isProcessing vastgelopen banner */}
        {isProcessingStuck && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-3 border border-amber-500/40 bg-amber-900/20 text-amber-300 text-sm">
            <span className="flex-1">
              <strong>Verwerkingsvergrendeling actief.</strong> Een eerdere publicatie is vastgelopen. Reset de vergrendeling om opnieuw te kunnen publiceren.
            </span>
            <button
              onClick={resetProcessingLock}
              disabled={resettingProcessing}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {resettingProcessing ? "Resetten..." : "Reset vergrendeling"}
            </button>
          </div>
        )}

        {/* Feedback */}
        {pointsMsg && (
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 mb-3 border text-sm ${
              pointsMsg.type === "ok"
                ? "bg-green-900/20 border-green-500/30 text-green-400"
                : "bg-red-900/20 border-red-500/30 text-red-400"
            }`}
          >
            <span className="flex-1">{pointsMsg.text}</span>
            <button onClick={() => setPointsMsg(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">
              ×
            </button>
          </div>
        )}

        {/* Actiebalk voor geselecteerde wedstrijden */}
        {processSelectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 mb-3 flex-wrap">
            <span className="text-sm text-slate-300 flex-1">
              {processSelectedIds.size} geselecteerd voor verwerking
            </span>
            <button
              onClick={processPoints}
              disabled={processing}
              className={BTN_PRIMARY + " disabled:opacity-40"}
            >
              {processing ? "Verwerken..." : `Verwerk ${processSelectedIds.size} geselecteerde`}
            </button>
            <button onClick={() => setProcessSelectedIds(new Set())} className={BTN_SECONDARY}>
              Deselecteer
            </button>
          </div>
        )}

        {loadingMatches ? (
          <p className="text-slate-500 text-sm py-4">Laden...</p>
        ) : filteredMatches.length === 0 ? (
          <p className="text-slate-500 text-sm py-4">Geen wedstrijden gevonden.</p>
        ) : (
          <>
            {/* Mobiel: kaartjes */}
            <div className="md:hidden space-y-2">
              {filteredMatches.map((m) => {
                const isProcessable = m.status === "APPROVED" || m.status === "CORRECTION";
                return (
                  <div
                    key={m.id}
                    id={`match-${m.id}`}
                    className={`bg-slate-800/50 rounded-xl p-3 border transition-colors ${
                      isProcessable && processSelectedIds.has(m.id)
                        ? "border-cyan-500/50 bg-cyan-500/5"
                        : "border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {isProcessable ? (
                        <input
                          type="checkbox"
                          checked={processSelectedIds.has(m.id)}
                          onChange={() => toggleProcessSelect(m.id)}
                          className="mt-0.5 accent-cyan-500 shrink-0"
                        />
                      ) : (
                        <span className="w-4 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-white text-sm truncate">{m.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {TEAM_LABEL[m.clubTeam]} ·{" "}
                              {new Date(m.matchDate).toLocaleDateString("nl-NL", {
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              · {m.homeAway === "HOME" ? "Thuis" : m.homeAway === "AWAY" ? "Uit" : "Neutraal"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status]}`}>
                              {STATUS_LABEL[m.status]}
                            </span>
                            {(m.status === "APPROVED" || m.status === "CORRECTION") &&
                              (() => {
                                const days = Math.floor(
                                  (Date.now() - new Date(m.matchDate).getTime()) / 86400000
                                );
                                if (days < 3) return null;
                                return (
                                  <span
                                    className={`text-xs ${days >= 7 ? "text-amber-400" : "text-slate-500"}`}
                                  >
                                    {days} dagen geleden
                                  </span>
                                );
                              })()}
                            <span className="text-sm font-bold text-slate-300">
                              {m.homeAway === "AWAY"
                                ? `${m.goalsConceded}–${m.goalsScored}`
                                : `${m.goalsScored}–${m.goalsConceded}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pl-6">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setMatchMenuId(matchMenuId === m.id ? null : m.id)}
                          className={BTN_SMALL}
                        >
                          Acties ▾
                        </button>
                        {matchMenuId === m.id && (
                          <div className="absolute left-0 top-8 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl min-w-[220px] overflow-hidden">
                            {m.status !== "PROCESSED" && m.status !== "CORRECTION" && (
                              <button
                                onClick={() => {
                                  openEditMatch(m);
                                  setMatchMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                              >
                                Bewerken
                              </button>
                            )}
                            <button
                              onClick={() => {
                                openEditMatch(m);
                                setMatchMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              Prestaties
                            </button>
                            {m.status === "PENDING" && (
                              <button
                                onClick={() => {
                                  approveMatch(m.id, "APPROVED");
                                  setMatchMenuId(null);
                                }}
                                disabled={approvingId === m.id}
                                className="w-full text-left px-4 py-2.5 text-sm text-green-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                              >
                                Goedkeuren
                              </button>
                            )}
                            {(m.status === "PENDING" || m.status === "APPROVED") && (
                              <button
                                onClick={() => {
                                  approveMatch(m.id, "REJECTED");
                                  setMatchMenuId(null);
                                }}
                                disabled={approvingId === m.id}
                                className="w-full text-left px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                              >
                                Afkeuren
                              </button>
                            )}
                            {m.status === "APPROVED" &&
                              publishMoments.filter((p) => !p.publishedAt).length > 0 && (
                                <div className="border-t border-slate-700">
                                  <p className="px-4 pt-2.5 pb-1 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                                    Inplannen bij
                                  </p>
                                  {m.publishMomentId ? (
                                    <button
                                      onClick={() => {
                                        assignToMoment(m.id, null);
                                        setMatchMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                                    >
                                      Verwijder uit wachtrij
                                    </button>
                                  ) : (
                                    publishMoments
                                      .filter((p) => !p.publishedAt)
                                      .map((pm) => (
                                        <button
                                          key={pm.id}
                                          onClick={() => {
                                            assignToMoment(m.id, pm.id);
                                            setMatchMenuId(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-slate-700 transition-colors"
                                        >
                                          {pm.label}
                                        </button>
                                      ))
                                  )}
                                </div>
                              )}
                            {m.status === "PROCESSED" && (
                              <button
                                onClick={() => {
                                  revertMatch(m.id);
                                }}
                                disabled={revertingMatchId === m.id}
                                className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                              >
                                {revertingMatchId === m.id ? "Bezig..." : "Terugdraaien"}
                              </button>
                            )}
                            {m.status === "CORRECTION" && (
                              <button
                                onClick={() => {
                                  cancelCorrection(m.id);
                                  setMatchMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:bg-slate-700 transition-colors"
                              >
                                Annuleer correctie
                              </button>
                            )}
                            {m.status !== "PROCESSED" && (
                              <>
                                <div className="border-t border-slate-700" />
                                <button
                                  onClick={() => deleteMatch(m.id)}
                                  disabled={deletingMatchId === m.id}
                                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                                >
                                  Verwijderen
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: tabel */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-800">
                    <th className="pb-2 w-8">
                      <input
                        type="checkbox"
                        checked={
                          filteredMatches.filter(
                            (m) => m.status === "APPROVED" || m.status === "CORRECTION"
                          ).length > 0 &&
                          filteredMatches
                            .filter((m) => m.status === "APPROVED" || m.status === "CORRECTION")
                            .every((m) => processSelectedIds.has(m.id))
                        }
                        ref={(el) => {
                          if (el) {
                            const p = filteredMatches.filter(
                              (m) => m.status === "APPROVED" || m.status === "CORRECTION"
                            );
                            el.indeterminate =
                              p.some((m) => processSelectedIds.has(m.id)) &&
                              !p.every((m) => processSelectedIds.has(m.id));
                          }
                        }}
                        onChange={toggleAllProcessSelect}
                        className="accent-cyan-500"
                      />
                    </th>
                    <th className="pb-2 font-semibold whitespace-nowrap">Datum</th>
                    <th className="pb-2 font-semibold whitespace-nowrap">Thuisploeg</th>
                    <th className="pb-2 font-semibold whitespace-nowrap">Uitploeg</th>
                    <th className="pb-2 font-semibold whitespace-nowrap">Uitslag</th>
                    <th className="pb-2 font-semibold whitespace-nowrap">Status</th>
                    <th className="pb-2 font-semibold text-right whitespace-nowrap">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((m) => {
                    const isProcessable = m.status === "APPROVED" || m.status === "CORRECTION";
                    return (
                      <tr
                        key={m.id}
                        id={`match-${m.id}`}
                        className={`border-b border-slate-800/60 ${
                          isProcessable && processSelectedIds.has(m.id)
                            ? "bg-cyan-500/5"
                            : "hover:bg-slate-800/30"
                        }`}
                      >
                        <td className="py-2">
                          {isProcessable && (
                            <input
                              type="checkbox"
                              checked={processSelectedIds.has(m.id)}
                              onChange={() => toggleProcessSelect(m.id)}
                              className="accent-cyan-500"
                            />
                          )}
                        </td>
                        <td className="py-2 text-slate-400 text-xs whitespace-nowrap">
                          {new Date(m.matchDate).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="py-2 text-slate-400 whitespace-nowrap">
                          {m.homeAway === "AWAY" ? m.name : TEAM_LABEL[m.clubTeam] ?? m.clubTeam}
                        </td>
                        <td className="py-2 font-medium text-white whitespace-nowrap">
                          {m.homeAway === "HOME" ? m.name : TEAM_LABEL[m.clubTeam] ?? m.clubTeam}
                        </td>
                        <td className="py-2 text-slate-400 whitespace-nowrap">
                          {m.homeAway === "AWAY"
                            ? `${m.goalsConceded}–${m.goalsScored}`
                            : `${m.goalsScored}–${m.goalsConceded}`}
                          <span className="text-xs text-slate-600 ml-1.5">
                            ({m.performances.filter((p) => p.played).length})
                          </span>
                        </td>
                        <td className="py-2 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${STATUS_STYLE[m.status]}`}
                            >
                              {STATUS_LABEL[m.status]}
                            </span>
                            {m.publishMoment && !m.publishMoment.publishedAt && (
                              <span className="text-xs text-cyan-400 truncate max-w-[140px]">
                                📅 {m.publishMoment.label}
                              </span>
                            )}
                            {(m.status === "APPROVED" || m.status === "CORRECTION") &&
                              !m.publishMomentId &&
                              (() => {
                                const days = Math.floor(
                                  (Date.now() - new Date(m.matchDate).getTime()) / 86400000
                                );
                                if (days < 3) return null;
                                return (
                                  <span
                                    className={`text-xs ${days >= 7 ? "text-amber-400" : "text-slate-500"}`}
                                  >
                                    {days}d
                                  </span>
                                );
                              })()}
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={() => setMatchMenuId(matchMenuId === m.id ? null : m.id)}
                              className={BTN_SMALL}
                            >
                              Acties ▾
                            </button>
                            {matchMenuId === m.id && (
                              <div className="absolute right-0 top-8 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl min-w-[220px] overflow-hidden">
                                {m.status !== "PROCESSED" && m.status !== "CORRECTION" && (
                                  <button
                                    onClick={() => {
                                      openEditMatch(m);
                                      setMatchMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                                  >
                                    Bewerken
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    openEditMatch(m);
                                    setMatchMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                                >
                                  Prestaties
                                </button>
                                {m.status === "PENDING" && (
                                  <button
                                    onClick={() => {
                                      approveMatch(m.id, "APPROVED");
                                      setMatchMenuId(null);
                                    }}
                                    disabled={approvingId === m.id}
                                    className="w-full text-left px-4 py-2.5 text-sm text-green-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                                  >
                                    Goedkeuren
                                  </button>
                                )}
                                {(m.status === "PENDING" || m.status === "APPROVED") && (
                                  <button
                                    onClick={() => {
                                      approveMatch(m.id, "REJECTED");
                                      setMatchMenuId(null);
                                    }}
                                    disabled={approvingId === m.id}
                                    className="w-full text-left px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                                  >
                                    Afkeuren
                                  </button>
                                )}
                                {m.status === "APPROVED" &&
                                  publishMoments.filter((p) => !p.publishedAt).length > 0 && (
                                    <div className="border-t border-slate-700">
                                      <p className="px-4 pt-2.5 pb-1 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                                        Inplannen bij
                                      </p>
                                      {m.publishMomentId ? (
                                        <button
                                          onClick={() => {
                                            assignToMoment(m.id, null);
                                            setMatchMenuId(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                                        >
                                          Verwijder uit wachtrij
                                        </button>
                                      ) : (
                                        publishMoments
                                          .filter((p) => !p.publishedAt)
                                          .map((pm) => (
                                            <button
                                              key={pm.id}
                                              onClick={() => {
                                                assignToMoment(m.id, pm.id);
                                                setMatchMenuId(null);
                                              }}
                                              className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-slate-700 transition-colors"
                                            >
                                              {pm.label}
                                            </button>
                                          ))
                                      )}
                                    </div>
                                  )}
                                {m.status === "PROCESSED" && (
                                  <button
                                    onClick={() => {
                                      revertMatch(m.id);
                                    }}
                                    disabled={revertingMatchId === m.id}
                                    className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                                  >
                                    {revertingMatchId === m.id ? "Bezig..." : "Terugdraaien"}
                                  </button>
                                )}
                                {m.status === "CORRECTION" && (
                                  <button
                                    onClick={() => {
                                      cancelCorrection(m.id);
                                      setMatchMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:bg-slate-700 transition-colors"
                                  >
                                    Annuleer correctie
                                  </button>
                                )}
                                {m.status !== "PROCESSED" && (
                                  <>
                                    <div className="border-t border-slate-700" />
                                    <button
                                      onClick={() => deleteMatch(m.id)}
                                      disabled={deletingMatchId === m.id}
                                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                                    >
                                      Verwijderen
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Rechts: Publicatieplanning (desktop only) */}
      <aside className="hidden lg:flex flex-col gap-3 w-72 shrink-0">
        <div className="bg-slate-900 neon-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Publicatieplanning</h2>
            <button
              onClick={() => {
                setNewMomentForm({ label: "", scheduledAt: "" });
                setNewMomentModal(true);
              }}
              className="px-2.5 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors"
            >
              + Nieuw
            </button>
          </div>
          {(() => {
            const pending = publishMoments.filter((pm) => !pm.publishedAt);
            const processed = publishMoments.filter((pm) => pm.publishedAt);
            return (
              <div className="space-y-2">
                {pending.length === 0 && processed.length === 0 && (
                  <p className="text-slate-500 text-xs">Nog geen momenten aangemaakt.</p>
                )}
                {pending.map((pm) => {
                  const approvedInMoment = adminMatches.filter(
                    (m) => m.publishMomentId === pm.id && m.status === "APPROVED"
                  );
                  const allInMoment = adminMatches.filter((m) => m.publishMomentId === pm.id);
                  const isPast = new Date(pm.scheduledAt) <= new Date();
                  return (
                    <div
                      key={pm.id}
                      className={`rounded-xl border p-3 ${
                        isPast
                          ? "border-amber-500/30 bg-amber-900/10"
                          : "border-slate-700 bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-white text-sm leading-tight">{pm.label}</span>
                        {isPast ? (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-500/30 shrink-0">
                            Wacht
                          </span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                            Gepland
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        {new Date(pm.scheduledAt).toLocaleString("nl-NL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Europe/Amsterdam",
                        })}
                      </p>
                      <p className="text-xs text-slate-400 mb-2">
                        {allInMoment.length} wedstrijd{allInMoment.length !== 1 ? "en" : ""}
                        {approvedInMoment.length > 0 && (
                          <span className="text-green-400 ml-1">· {approvedInMoment.length} klaar</span>
                        )}
                      </p>
                      {allInMoment.length > 0 && (
                        <div className="space-y-0.5 mb-2">
                          {allInMoment.map((m) => (
                            <div key={m.id} className="flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  m.status === "APPROVED"
                                    ? "bg-green-400"
                                    : m.status === "PENDING"
                                    ? "bg-amber-400"
                                    : "bg-slate-600"
                                }`}
                              />
                              <span className="text-xs text-slate-400 truncate">
                                {TEAM_LABEL[m.clubTeam] ?? m.clubTeam} vs {m.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => publishMoment(pm.id)}
                          disabled={
                            publishingMomentId === pm.id ||
                            checkingConflicts ||
                            approvedInMoment.length === 0
                          }
                          className="flex-1 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-40"
                        >
                          {publishingMomentId === pm.id
                            ? "Verwerken..."
                            : checkingConflicts
                            ? "Controleren..."
                            : `Publiceer (${approvedInMoment.length})`}
                        </button>
                        <button
                          onClick={() => deleteMoment(pm.id)}
                          disabled={deletingMomentId === pm.id}
                          className="px-2.5 py-1.5 text-xs bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors border border-red-500/20"
                        >
                          {deletingMomentId === pm.id ? "..." : "✕"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {processed.length > 0 && (
                  <div className="border border-slate-700/50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowProcessedMoments((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/40 hover:bg-slate-800/70 transition-colors text-left"
                    >
                      <span className="text-xs font-medium text-slate-400">
                        Verwerkt ({processed.length})
                      </span>
                      <span className="text-slate-600 text-xs">{showProcessedMoments ? "▲" : "▼"}</span>
                    </button>
                    {showProcessedMoments && (
                      <div className="divide-y divide-slate-700/40">
                        {processed.map((pm) => (
                          <div key={pm.id} className="flex items-center gap-2 px-3 py-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-slate-400 truncate block">
                                {pm.label}
                              </span>
                              <span className="text-xs text-slate-600">
                                {new Date(pm.publishedAt!).toLocaleString("nl-NL", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "Europe/Amsterdam",
                                })}
                              </span>
                            </div>
                            <button
                              onClick={() => deleteMoment(pm.id)}
                              disabled={deletingMomentId === pm.id}
                              title="Verwijderen"
                              className="px-2 py-1.5 text-xs bg-red-900/20 text-red-500 rounded hover:bg-red-900/40 transition-colors border border-red-500/20 shrink-0"
                            >
                              {deletingMomentId === pm.id ? "..." : "✕"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </aside>

      {/* Backdrop: sluit dropdown menu bij klik buiten */}
      {matchMenuId && <div className="fixed inset-0 z-40" onClick={() => setMatchMenuId(null)} />}

      {/* Modal: wedstrijd bewerken / prestaties bekijken */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editMatchReadOnly ? "Prestaties bekijken" : "Wedstrijd bewerken"}
                </h3>
                <p className="text-sm text-slate-500">
                  {TEAM_LABEL[editingMatch.clubTeam] ?? editingMatch.clubTeam}
                </p>
              </div>
              <button
                onClick={closeEditMatch}
                className="text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {/* Wedstrijd details: bewerkbaar of readonly */}
            {editMatchReadOnly ? (
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm">
                  <span className="text-slate-500">Tegenstander: </span>
                  <span className="text-white font-medium">{editingMatch.name}</span>
                </div>
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm">
                  <span className="text-slate-500">Datum: </span>
                  <span className="text-white">
                    {new Date(editingMatch.matchDate).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm">
                  <span className="text-slate-500">Uitslag: </span>
                  <span className="text-white font-bold">
                    {editingMatch.homeAway === "AWAY"
                      ? `${editingMatch.goalsConceded}–${editingMatch.goalsScored}`
                      : `${editingMatch.goalsScored}–${editingMatch.goalsConceded}`}
                  </span>
                </div>
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm">
                  <span className="text-slate-500">Status: </span>
                  <span
                    className={`font-medium ${
                      STATUS_STYLE[editingMatch.status].includes("orange")
                        ? "text-orange-400"
                        : STATUS_STYLE[editingMatch.status].includes("blue")
                        ? "text-blue-400"
                        : "text-slate-300"
                    }`}
                  >
                    {STATUS_LABEL[editingMatch.status]}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div>
                  <label className={LABEL}>Tegenstander</label>
                  <input
                    type="text"
                    value={editMatchForm.name}
                    onChange={(e) => setEditMatchForm({ ...editMatchForm, name: e.target.value })}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Datum & tijd</label>
                  <input
                    type="datetime-local"
                    value={editMatchForm.matchDate}
                    onChange={(e) => setEditMatchForm({ ...editMatchForm, matchDate: e.target.value })}
                    className={INPUT}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={LABEL}>Thuis/Uit</label>
                    <select
                      value={editMatchForm.homeAway}
                      onChange={(e) => {
                        const newHA = e.target.value;
                        const shouldSwap =
                          (editMatchForm.homeAway === "HOME" && newHA === "AWAY") ||
                          (editMatchForm.homeAway === "AWAY" && newHA === "HOME");
                        setEditMatchForm({
                          ...editMatchForm,
                          homeAway: newHA,
                          ...(shouldSwap
                            ? { thuisGoals: editMatchForm.uitGoals, uitGoals: editMatchForm.thuisGoals }
                            : {}),
                        });
                      }}
                      className={SELECT}
                    >
                      <option value="HOME">Thuis</option>
                      <option value="AWAY">Uit</option>
                      <option value="NEUTRAL">Neutraal</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Goals thuisploeg</label>
                    <input
                      type="number"
                      value={editMatchForm.thuisGoals}
                      onChange={(e) =>
                        setEditMatchForm({ ...editMatchForm, thuisGoals: Number(e.target.value) })
                      }
                      className={INPUT}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Goals uitploeg</label>
                    <input
                      type="number"
                      value={editMatchForm.uitGoals}
                      onChange={(e) =>
                        setEditMatchForm({ ...editMatchForm, uitGoals: Number(e.target.value) })
                      }
                      className={INPUT}
                      min="0"
                    />
                  </div>
                </div>
                {editMatchError && (
                  <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">
                    {editMatchError}
                  </p>
                )}
              </div>
            )}

            {/* Extra scorers + notes (read-only weergave) */}
            {(editingMatch.extraScorers?.length || editingMatch.notes) && (
              <div className="border-t border-slate-700 pt-5 space-y-3">
                {editingMatch.extraScorers && editingMatch.extraScorers.length > 0 && (
                  <div>
                    <label className={LABEL}>Doelpunten buiten selectie</label>
                    <div className="space-y-1 mt-1">
                      {(editingMatch.extraScorers as { goals: number; description: string }[]).map(
                        (s, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm bg-slate-800/50 rounded-lg px-3 py-1.5"
                          >
                            <span className="text-white font-semibold w-6 text-center">{s.goals}</span>
                            <span className="text-slate-400">{s.description}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
                {editingMatch.notes && (
                  <div>
                    <label className={LABEL}>Opmerkingen</label>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap mt-1 bg-slate-800/50 rounded-lg px-3 py-2">
                      {editingMatch.notes}
                    </p>
                  </div>
                )}
                {!editMatchReadOnly && (
                  <div>
                    <label className={LABEL}>Opmerkingen bewerken</label>
                    <textarea
                      value={editMatchForm.notes}
                      onChange={(e) => setEditMatchForm({ ...editMatchForm, notes: e.target.value })}
                      rows={3}
                      placeholder="Eigen doelen, bijzonderheden, weetjes..."
                      className={`${INPUT} resize-none`}
                    />
                  </div>
                )}
              </div>
            )}
            {!editMatchReadOnly && !editingMatch.notes && (
              <div className="border-t border-slate-700 pt-5">
                <label className={LABEL}>Opmerkingen</label>
                <textarea
                  value={editMatchForm.notes}
                  onChange={(e) => setEditMatchForm({ ...editMatchForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Eigen doelen, bijzonderheden, weetjes..."
                  className={`${INPUT} resize-none`}
                />
              </div>
            )}

            {/* Spelersbijdragen */}
            <div className="border-t border-slate-700 pt-5">
              <p className="text-sm font-semibold text-slate-400 mb-3">Spelersbijdragen</p>
              {editingMatch.performances.length === 0 ? (
                <p className="text-slate-500 text-sm mb-4">Nog geen prestaties ingevoerd.</p>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-sm min-w-[420px]">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-800">
                        <th className="pb-2 font-semibold">Speler</th>
                        <th className="pb-2 font-semibold text-center">Mee</th>
                        <th className="pb-2 font-semibold text-center">Goals</th>
                        <th className="pb-2 font-semibold text-center">Pen.</th>
                        <th className="pb-2 font-semibold text-center">Ass.</th>
                        <th className="pb-2 font-semibold text-center">E.G.</th>
                        <th className="pb-2 font-semibold text-center">Geel</th>
                        <th className="pb-2 font-semibold text-center">Rood</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingMatch.performances.map((p) => {
                        const ed = editPerfsData[p.playerId] ?? {
                          played: p.played,
                          goals: p.goals,
                          penaltyGoals: p.penaltyGoals,
                          assists: p.assists,
                          ownGoals: p.ownGoals,
                          yellowCards: p.yellowCards,
                          redCard: p.redCard,
                        };
                        return (
                          <tr
                            key={p.playerId}
                            className={`border-b border-slate-800/60 ${!ed.played ? "opacity-40" : ""}`}
                          >
                            <td className="py-1.5 font-medium text-white">
                              {p.player.name}
                              <span className="text-slate-500 text-xs ml-1">
                                {POSITION_LABEL[p.player.position] ?? p.player.position}
                              </span>
                            </td>
                            <td className="py-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={ed.played}
                                disabled={editMatchReadOnly}
                                onChange={(e) => updatePerfField(p.playerId, "played", e.target.checked)}
                                className="accent-cyan-500 disabled:opacity-60"
                              />
                            </td>
                            <td className="py-1.5 text-center">
                              <input
                                type="number"
                                value={ed.goals}
                                min={0}
                                readOnly={editMatchReadOnly}
                                onChange={(e) => updatePerfField(p.playerId, "goals", Number(e.target.value))}
                                className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`}
                              />
                            </td>
                            <td className="py-1.5 text-center">
                              <input
                                type="number"
                                value={ed.penaltyGoals}
                                min={0}
                                readOnly={editMatchReadOnly}
                                onChange={(e) =>
                                  updatePerfField(p.playerId, "penaltyGoals", Number(e.target.value))
                                }
                                className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`}
                              />
                            </td>
                            <td className="py-1.5 text-center">
                              <input
                                type="number"
                                value={ed.assists}
                                min={0}
                                readOnly={editMatchReadOnly}
                                onChange={(e) =>
                                  updatePerfField(p.playerId, "assists", Number(e.target.value))
                                }
                                className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`}
                              />
                            </td>
                            <td className="py-1.5 text-center">
                              <input
                                type="number"
                                value={ed.ownGoals}
                                min={0}
                                readOnly={editMatchReadOnly}
                                onChange={(e) =>
                                  updatePerfField(p.playerId, "ownGoals", Number(e.target.value))
                                }
                                className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`}
                              />
                            </td>
                            <td className="py-1.5 text-center">
                              <input
                                type="number"
                                value={ed.yellowCards}
                                min={0}
                                max={2}
                                readOnly={editMatchReadOnly}
                                onChange={(e) =>
                                  updatePerfField(p.playerId, "yellowCards", Number(e.target.value))
                                }
                                className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`}
                              />
                            </td>
                            <td className="py-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={ed.redCard}
                                disabled={editMatchReadOnly}
                                onChange={(e) =>
                                  updatePerfField(p.playerId, "redCard", e.target.checked)
                                }
                                className="accent-cyan-500 disabled:opacity-60"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6">
              {editMatchReadOnly ? (
                <button onClick={closeEditMatch} className={BTN_SECONDARY}>
                  Sluiten
                </button>
              ) : (
                <>
                  <button onClick={closeEditMatch} className={BTN_SECONDARY}>
                    Annuleer
                  </button>
                  <button onClick={saveAll} disabled={editMatchSaving} className={BTN_PRIMARY}>
                    {editMatchSaving ? "Opslaan..." : "Opslaan"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: FLEX conflicten */}
      {conflictModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">Speler conflict</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Alle wedstrijden zijn standaard aangevinkt. Haal het vinkje weg om een wedstrijd uit te sluiten.
                </p>
              </div>
              <button
                onClick={() => setConflictModal(null)}
                className="text-slate-500 hover:text-slate-300 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {conflictModal.conflicts.map((conflict) => {
                const selected = conflictModal.selections[conflict.playerId];
                const noneSelected = selected.size === 0;
                return (
                  <div key={conflict.playerId} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-white">{conflict.player.name}</span>
                      {conflict.player.altTeam && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-violet-900/50 text-violet-300 border border-violet-500/30 font-medium">
                          FLEX
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {POSITION_LABEL[conflict.player.position] ?? conflict.player.position}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      Oorspronkelijk elftal:{" "}
                      <span className="text-slate-300">
                        {TEAM_LABEL[conflict.player.clubTeam] ?? conflict.player.clubTeam}
                      </span>
                    </p>
                    <div className="space-y-2">
                      {conflict.matches.map((m) => {
                        const isChecked = selected.has(m.matchId);
                        return (
                          <label
                            key={m.matchId}
                            className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                              isChecked
                                ? "border-cyan-500/50 bg-cyan-900/20"
                                : "border-slate-600 bg-slate-800 hover:border-slate-500"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setConflictModal((prev) => {
                                  if (!prev) return prev;
                                  const next = new Set(prev.selections[conflict.playerId]);
                                  if (next.has(m.matchId)) next.delete(m.matchId);
                                  else next.add(m.matchId);
                                  return {
                                    ...prev,
                                    selections: { ...prev.selections, [conflict.playerId]: next },
                                  };
                                });
                              }}
                              className="mt-0.5 accent-cyan-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm text-white font-medium">{m.matchName}</span>
                                {m.isOriginalTeam && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-500/20 font-medium">
                                    Oorspronkelijk
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs ${isChecked ? "text-slate-400" : "text-slate-600"}`}>
                                {TEAM_LABEL[m.matchClubTeam] ?? m.matchClubTeam}
                                {" · "}
                                {new Date(m.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              <div className={`flex items-center gap-2 mt-1 text-xs ${isChecked ? "text-slate-300" : "text-slate-600"}`}>
                                {m.goals > 0 && <span>{m.goals} ⚽</span>}
                                {m.assists > 0 && <span>{m.assists} 🅰</span>}
                                {m.yellowCards > 0 && <span>{m.yellowCards} 🟨</span>}
                                {m.redCard && <span>🟥</span>}
                                {m.ownGoals > 0 && <span>{m.ownGoals} ED</span>}
                                {m.goals === 0 && m.assists === 0 && m.yellowCards === 0 && !m.redCard && m.ownGoals === 0 && (
                                  <span>Gespeeld</span>
                                )}
                                <span className={`ml-auto font-semibold ${isChecked ? "text-cyan-400" : "text-slate-600 line-through"}`}>
                                  {m.points > 0 ? "+" : ""}{m.points} ptn
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {noneSelected && (
                      <p className="text-xs text-amber-400 mt-2">
                        Selecteer minimaal één wedstrijd om te verwerken, of deselecteer alles om de speler
                        over te slaan.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
              <button onClick={() => setConflictModal(null)} className={BTN_SECONDARY}>
                Annuleer
              </button>
              <button onClick={confirmPublishWithConflicts} className={BTN_PRIMARY}>
                Publiceer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nieuw publicatiemoment */}
      {newMomentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Nieuw publicatiemoment</h3>
              <button
                onClick={() => setNewMomentModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Naam / omschrijving</label>
                <input
                  type="text"
                  value={newMomentForm.label}
                  onChange={(e) => setNewMomentForm({ ...newMomentForm, label: e.target.value })}
                  placeholder="bijv. Update speelronde 3"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Datum en tijd</label>
                <input
                  type="datetime-local"
                  value={newMomentForm.scheduledAt}
                  onChange={(e) => setNewMomentForm({ ...newMomentForm, scheduledAt: e.target.value })}
                  className={INPUT}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setNewMomentModal(false)} className={BTN_SECONDARY}>
                Annuleer
              </button>
              <button
                onClick={createMoment}
                disabled={newMomentSaving || !newMomentForm.label || !newMomentForm.scheduledAt}
                className={BTN_PRIMARY}
              >
                {newMomentSaving ? "Aanmaken..." : "Aanmaken"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
