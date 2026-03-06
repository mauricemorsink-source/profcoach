"use client";

import { useState, useEffect } from "react";

type GameSettings = {
  budget: number;
  deadline: string | null;
  registrationOpen: boolean;
  captainEnabled: boolean;
  rulesText: string;
  termsText: string;
  privacyText: string;
};

type Player = {
  id: string;
  name: string;
  shortName?: string | null;
  position: "GK" | "DEF" | "MID" | "ATT";
  clubTeam: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE" | "DAMES";
  value: number;
};

type PlayerForm = {
  name: string;
  shortName: string;
  position: string;
  clubTeam: string;
  value: string;
};

type ImportResult = {
  imported: number;
  alreadyPresent: number;
  skipped: number;
  errors: string[];
};

type TeamPlayer = {
  slotIndex: number;
  player: { name: string; position: string; clubTeam: string };
};

type TeamEntry = {
  id: string;
  locked: boolean;
  formation: { code: string } | null;
  players: TeamPlayer[];
};

type User = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER" | "MANAGER";
  managedTeam: string | null;
  isParticipant: boolean;
  createdAt: string;
  teamEntries: TeamEntry[];
};

type PointsConfig = {
  id: string;
  label: string;
  gkPoints: number | null;
  defPoints: number | null;
  midPoints: number | null;
  attPoints: number | null;
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
  seasonStats: { totalPoints: number; goals: number; assists: number; yellowCards: number; redCards: number; cleanSheets: number; wins: number; draws: number; matchesPlayed: number } | null;
  performances: PlayerStatPerf[];
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

const POSITIONS = ["GK", "DEF", "MID", "ATT"];
const TEAMS = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];

const POSITION_LABEL: Record<string, string> = {
  GK: "Keeper", DEF: "Verdediger", MID: "Middenvelder", ATT: "Aanvaller",
};

const POSITION_SHORT: Record<string, string> = {
  GK: "GK", DEF: "VER", MID: "MID", ATT: "AAN",
};

const TAB_LABELS: Record<string, string> = {
  instellingen: "Spelinstellingen", puntensysteem: "Puntensysteem",
  wedstrijden: "Wedstrijden", spelers: "Spelersbeheer", gebruikers: "Gebruikers",
};

const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Ingediend", APPROVED: "Goedgekeurd", REJECTED: "Afgekeurd", PROCESSED: "Verwerkt", CORRECTION: "Correctie",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-900/40 text-amber-400 border border-amber-500/30",
  APPROVED: "bg-green-900/40 text-green-400 border border-green-500/30",
  REJECTED: "bg-red-900/40 text-red-400 border border-red-500/30",
  PROCESSED: "bg-blue-900/40 text-blue-400 border border-blue-500/30",
  CORRECTION: "bg-orange-900/40 text-orange-400 border border-orange-500/30",
};

const emptyForm: PlayerForm = { name: "", shortName: "", position: "GK", clubTeam: "ONE", value: "" };

const TAB_SECTIONS = [
  {
    heading: "Instellingen",
    tabs: [
      { id: "instellingen",  label: "Spelinstellingen" },
      { id: "puntensysteem", label: "Puntensysteem" },
    ],
  },
  {
    heading: "Seizoen",
    tabs: [
      { id: "wedstrijden", label: "Wedstrijden" },
      { id: "spelers",     label: "Spelersbeheer" },
    ],
  },
  {
    heading: "Accounts",
    tabs: [
      { id: "gebruikers", label: "Gebruikers" },
    ],
  },
] as const;

type Tab = "instellingen" | "puntensysteem" | "wedstrijden" | "spelers" | "gebruikers";

const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const LABEL = "block text-sm font-medium text-slate-400 mb-1";
const SELECT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700";
const BTN_DANGER = "px-3 py-1 text-xs bg-red-900/40 text-red-400 rounded hover:bg-red-900/60 font-medium border border-red-500/30 transition-colors";
const BTN_SMALL = "px-3 py-1 text-xs bg-slate-800 text-slate-400 rounded hover:bg-slate-700 font-medium border border-slate-700 transition-colors";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("instellingen");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Players
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [form, setForm] = useState<PlayerForm>(emptyForm);
  const [formError, setFormError] = useState("");
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

  // Game settings
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<GameSettings>({
    budget: 1750, deadline: null, registrationOpen: true, captainEnabled: false, rulesText: "", termsText: "", privacyText: "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
const [roleModal, setRoleModal] = useState<User | null>(null);
  const [roleForm, setRoleForm] = useState<{ role: string; managedTeam: string; isParticipant: boolean; name: string; email: string }>({ role: "USER", managedTeam: "ONE", isParticipant: true, name: "", email: "" });
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [linkGenerating, setLinkGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Points config
  const [pointsConfig, setPointsConfig] = useState<PointsConfig[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [pointsSaving, setPointsSaving] = useState(false);
  const [pointsMsg, setPointsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processSelectedIds, setProcessSelectedIds] = useState<Set<string>>(new Set());

  // Admin matches
  const [adminMatches, setAdminMatches] = useState<AdminMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [matchFilterTeam, setMatchFilterTeam] = useState("");
  const [matchFilterStatus, setMatchFilterStatus] = useState("");
  const [editingMatch, setEditingMatch] = useState<AdminMatch | null>(null);
  const [editMatchForm, setEditMatchForm] = useState({ name: "", matchDate: "", thuisGoals: 0, uitGoals: 0, homeAway: "HOME" });
  const [editMatchSaving, setEditMatchSaving] = useState(false);
  const [editMatchError, setEditMatchError] = useState("");
  const [matchMenuId, setMatchMenuId] = useState<string | null>(null);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
  const [revertingMatchId, setRevertingMatchId] = useState<string | null>(null);
  const [editPerfsData, setEditPerfsData] = useState<Record<string, { played: boolean; goals: number; penaltyGoals: number; assists: number; ownGoals: number; yellowCards: number; redCard: boolean }>>({});

  // Publish moments
  const [publishMoments, setPublishMoments] = useState<PublishMoment[]>([]);
  const [newMomentModal, setNewMomentModal] = useState(false);
  const [newMomentForm, setNewMomentForm] = useState({ label: "", scheduledAt: "" });
  const [newMomentSaving, setNewMomentSaving] = useState(false);
  const [publishingMomentId, setPublishingMomentId] = useState<string | null>(null);
  const [deletingMomentId, setDeletingMomentId] = useState<string | null>(null);
  const [assignMomentMatchId, setAssignMomentMatchId] = useState<string | null>(null);
  const [showProcessedMoments, setShowProcessedMoments] = useState(false);

  // Player stats
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

  async function loadSettings() {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data: GameSettings = await res.json();
      setSettings(data);
      setSettingsForm({
        budget: data.budget,
        deadline: data.deadline ? data.deadline.slice(0, 16) : "",
        registrationOpen: data.registrationOpen,
        captainEnabled: data.captainEnabled ?? false,
        rulesText: data.rulesText ?? "",
        termsText: data.termsText ?? "",
        privacyText: data.privacyText ?? "",
      });
    }
  }

  async function loadUsers() {
    setLoadingUsers(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoadingUsers(false);
  }

  async function loadPointsConfig() {
    setLoadingPoints(true);
    const res = await fetch("/api/admin/points-config");
    if (res.ok) setPointsConfig(await res.json());
    setLoadingPoints(false);
  }

  async function loadAdminMatches() {
    setLoadingMatches(true);
    const res = await fetch("/api/admin/matches");
    if (res.ok) {
      const matches = await res.json();
      setAdminMatches(matches);
    }
    setLoadingMatches(false);
  }

  function selectAllApproved() {
    const toProcess = adminMatches.filter((m) => m.status === "APPROVED" || m.status === "CORRECTION");
    setProcessSelectedIds(new Set(toProcess.map((m) => m.id)));
  }

  async function loadPublishMoments() {
    const res = await fetch("/api/admin/publish-moments");
    if (res.ok) setPublishMoments(await res.json());
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

  async function publishMoment(id: string) {
    setPublishingMomentId(id); setPointsMsg(null);
    const res = await fetch(`/api/admin/publish-moments/${id}/publish`, { method: "POST" });
    const data = await res.json();
    setPublishingMomentId(null);
    if (!res.ok) { setPointsMsg({ type: "err", text: data.error || "Publiceren mislukt" }); }
    else {
      setPointsMsg({ type: "ok", text: `Moment gepubliceerd: ${data.processed} wedstrijd${data.processed !== 1 ? "en" : ""} verwerkt, ${data.playersUpdated} spelers bijgewerkt` });
      await loadPublishMoments();
      await loadAdminMatches();
    }
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

  async function openPlayerStats(player: Player) {
    setPlayerStatsModal(player);
    setPlayerStats(null);
    setLoadingPlayerStats(true);
    const res = await fetch(`/api/admin/players/${player.id}/stats`);
    if (res.ok) setPlayerStats(await res.json());
    setLoadingPlayerStats(false);
  }

  useEffect(() => { loadPlayers(); loadSettings(); }, []);

  useEffect(() => {
    if (activeTab === "gebruikers" && users.length === 0) loadUsers();
    if (activeTab === "puntensysteem" && pointsConfig.length === 0) loadPointsConfig();
    if (activeTab === "wedstrijden") { loadAdminMatches(); loadPublishMoments(); }
  }, [activeTab]);

  const filteredPlayers = players.filter((p) => {
    if (filterName && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterTeam && p.clubTeam !== filterTeam) return false;
    if (filterPosition && p.position !== filterPosition) return false;
    return true;
  });

  const STATUS_SORT_ORDER: Record<string, number> = { APPROVED: 0, CORRECTION: 1, PENDING: 2, REJECTED: 3, PROCESSED: 4 };
  const filteredMatches = adminMatches
    .filter((m) => (!matchFilterTeam || m.clubTeam === matchFilterTeam) && (!matchFilterStatus || m.status === matchFilterStatus))
    .sort((a, b) => {
      const ao = STATUS_SORT_ORDER[a.status] ?? 5;
      const bo = STATUS_SORT_ORDER[b.status] ?? 5;
      if (ao !== bo) return ao - bo;
      return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
    });

  const editMatchReadOnly = !!editingMatch && (editingMatch.status === "PROCESSED" || editingMatch.status === "CORRECTION");

  function openAdd() { setForm(emptyForm); setFormError(""); setEditingPlayer(null); setModal("add"); }

  function openEdit(player: Player) {
    setForm({ name: player.name, shortName: player.shortName ?? "", position: player.position, clubTeam: player.clubTeam, value: player.value.toString() });
    setFormError(""); setEditingPlayer(player); setModal("edit");
  }

  async function savePlayer() {
    setSaving(true); setFormError("");
    const url = modal === "edit" ? `/api/admin/players/${editingPlayer!.id}` : "/api/admin/players";
    const method = modal === "edit" ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, value: Number(form.value) }) });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error || "Er is een fout opgetreden"); setSaving(false); return; }
    setModal(null); await loadPlayers(); setSaving(false);
  }

  async function deletePlayer(id: string) {
    setDeletingId(id);
    await fetch(`/api/admin/players/${id}`, { method: "DELETE" });
    setDeletingId(null); setConfirmDeleteId(null); await loadPlayers();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function toggleSelectAll() {
    const allSelected = filteredPlayers.every((p) => selectedIds.has(p.id));
    setSelectedIds((prev) => { const next = new Set(prev); filteredPlayers.forEach((p) => allSelected ? next.delete(p.id) : next.add(p.id)); return next; });
  }

  async function bulkDelete() {
    setBulkDeleting(true);
    await fetch("/api/admin/players", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selectedIds) }) });
    setSelectedIds(new Set()); setConfirmBulk(false); setBulkDeleting(false); await loadPlayers();
  }

  async function handleImport() {
    if (!importFile) return;
    setImporting(true); setImportResult(null);
    const formData = new FormData();
    formData.append("file", importFile);
    const res = await fetch("/api/admin/import-players", { method: "POST", body: formData });
    setImportResult(await res.json()); setImporting(false); await loadPlayers();
  }

  async function saveSettings() {
    setSettingsSaving(true); setSettingsMsg(null);
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ budget: Number(settingsForm.budget), deadline: settingsForm.deadline || null, registrationOpen: settingsForm.registrationOpen, captainEnabled: settingsForm.captainEnabled, rulesText: settingsForm.rulesText, termsText: settingsForm.termsText, privacyText: settingsForm.privacyText }) });
    const data = await res.json(); setSettingsSaving(false);
    if (!res.ok) { setSettingsMsg({ type: "err", text: data.error || "Opslaan mislukt" }); }
    else {
      setSettings(data);
      setSettingsForm({
        budget: data.budget,
        deadline: data.deadline ? data.deadline.slice(0, 16) : "",
        registrationOpen: data.registrationOpen,
        captainEnabled: data.captainEnabled ?? false,
        rulesText: data.rulesText ?? "",
        termsText: data.termsText ?? "",
        privacyText: data.privacyText ?? "",
      });
      setSettingsMsg({ type: "ok", text: "Instellingen opgeslagen" });
    }
  }

  async function savePointsConfig() {
    setPointsSaving(true); setPointsMsg(null);
    const res = await fetch("/api/admin/points-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pointsConfig) });
    const data = await res.json(); setPointsSaving(false);
    if (!res.ok) { setPointsMsg({ type: "err", text: data.error || "Opslaan mislukt" }); }
    else { setPointsConfig(data); setPointsMsg({ type: "ok", text: "Puntentabel opgeslagen" }); }
  }

  async function processPoints() {
    setProcessing(true); setPointsMsg(null);
    const body = processSelectedIds.size > 0 ? JSON.stringify({ matchIds: Array.from(processSelectedIds) }) : undefined;
    const res = await fetch("/api/admin/process-points", {
      method: "POST",
      ...(body ? { headers: { "Content-Type": "application/json" }, body } : {}),
    });
    const data = await res.json(); setProcessing(false);
    if (!res.ok) { setPointsMsg({ type: "err", text: data.error || "Verwerking mislukt" }); }
    else {
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
    setMatchMenuId(null); setRevertingMatchId(id); setPointsMsg(null);
    const res = await fetch(`/api/admin/matches/${id}/revert`, { method: "POST" });
    const data = await res.json(); setRevertingMatchId(null);
    if (!res.ok) { setPointsMsg({ type: "err", text: data.error || "Terugdraaien mislukt" }); }
    else {
      setPointsMsg({ type: "ok", text: `Wedstrijd teruggezet naar 'Goedgekeurd', ${data.playersReverted} spelers bijgewerkt` });
      await loadAdminMatches();
    }
  }

  async function approveMatch(id: string, status: "APPROVED" | "REJECTED") {
    setApprovingId(id);
    await fetch(`/api/admin/matches/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setApprovingId(null); await loadAdminMatches();
  }

  async function cancelCorrection(id: string) {
    await fetch(`/api/admin/matches/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "PROCESSED" }) });
    await loadAdminMatches();
  }

  async function saveRole() {
    if (!roleModal) return;
    setRoleSaving(true); setRoleError("");
    const res = await fetch(`/api/admin/users/${roleModal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: roleForm.role, managedTeam: roleForm.role === "MANAGER" ? roleForm.managedTeam : null, isParticipant: roleForm.isParticipant, name: roleForm.name || null, email: roleForm.email }) });
    const data = await res.json(); setRoleSaving(false);
    if (!res.ok) { setRoleError(data.error || "Er is een fout opgetreden"); return; }
    setRoleModal(null); await loadUsers();
  }

  function openRoleModal(user: User) {
    setRoleForm({ role: user.role, managedTeam: user.managedTeam ?? "ONE", isParticipant: user.isParticipant ?? true, name: user.name ?? "", email: user.email });
    setRoleError(""); setGeneratedLink(null); setRoleModal(user);
  }

  async function generateLoginLink(userId: string) {
    setLinkGenerating(true); setGeneratedLink(null);
    const res = await fetch(`/api/admin/users/${userId}/login-link`, { method: "POST" });
    const data = await res.json();
    setLinkGenerating(false);
    if (res.ok) setGeneratedLink(data.link);
  }

  function openEditMatch(m: AdminMatch) {
    const thuisGoals = m.homeAway === "HOME" ? m.goalsScored : m.goalsConceded;
    const uitGoals   = m.homeAway === "HOME" ? m.goalsConceded : m.goalsScored;
    setEditMatchForm({ name: m.name, matchDate: m.matchDate.slice(0, 16), thuisGoals, uitGoals, homeAway: m.homeAway });
    const data: Record<string, { played: boolean; goals: number; penaltyGoals: number; assists: number; ownGoals: number; yellowCards: number; redCard: boolean }> = {};
    for (const p of m.performances) {
      data[p.playerId] = { played: p.played, goals: p.goals, penaltyGoals: p.penaltyGoals, assists: p.assists, ownGoals: p.ownGoals, yellowCards: p.yellowCards, redCard: p.redCard };
    }
    setEditPerfsData(data);
    setEditMatchError(""); setEditingMatch(m);
  }

  async function saveAll() {
    if (!editingMatch) return;
    setEditMatchSaving(true); setEditMatchError("");
    const homeAway = editMatchForm.homeAway;
    const goalsScored   = homeAway === "HOME" ? Number(editMatchForm.thuisGoals) : Number(editMatchForm.uitGoals);
    const goalsConceded = homeAway === "HOME" ? Number(editMatchForm.uitGoals)   : Number(editMatchForm.thuisGoals);
    const res = await fetch(`/api/admin/matches/${editingMatch.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editMatchForm.name, matchDate: editMatchForm.matchDate, goalsScored, goalsConceded, homeAway }) });
    const data = await res.json();
    if (!res.ok) { setEditMatchSaving(false); setEditMatchError(data.error || "Opslaan mislukt"); return; }
    const performances = Object.entries(editPerfsData).map(([playerId, d]) => ({ playerId, ...d }));
    if (performances.length > 0) {
      const perfRes = await fetch(`/api/admin/matches/${editingMatch.id}/performances`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ performances }) });
      if (!perfRes.ok) { setEditMatchSaving(false); setEditMatchError("Prestaties opslaan mislukt"); return; }
    }
    setEditMatchSaving(false); setEditingMatch(null); await loadAdminMatches();
  }

  async function deleteMatch(id: string) {
    setDeletingMatchId(id); setMatchMenuId(null);
    const res = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    setDeletingMatchId(null);
    if (res.ok) await loadAdminMatches();
  }

  function toggleProcessSelect(id: string) {
    setProcessSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function toggleAllProcessSelect() {
    const processable = filteredMatches.filter((m) => m.status === "APPROVED" || m.status === "CORRECTION");
    const allSelected = processable.length > 0 && processable.every((m) => processSelectedIds.has(m.id));
    setProcessSelectedIds(allSelected ? new Set() : new Set(processable.map((m) => m.id)));
  }


  function updatePerfField(playerId: string, field: string, value: boolean | number) {
    setEditPerfsData((prev) => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }));
  }

  function updatePointsCell(id: string, field: "gkPoints" | "defPoints" | "midPoints" | "attPoints", value: string) {
    setPointsConfig((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value === "" ? null : Number(value) } : c));
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col md:flex-row" style={{ background: "#060b14" }}>
      {/* Mobile top bar + hamburger dropdown */}
      <div className="md:hidden relative shrink-0 z-30">
        <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3">
          <span className="text-sm font-semibold text-white">{TAB_LABELS[activeTab]}</span>
          <button onClick={() => setMobileMenuOpen((v) => !v)}
            className="p-1 text-slate-400 hover:text-white transition-colors text-xl leading-none w-8 h-8 flex items-center justify-center">
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-2xl">
            {TAB_SECTIONS.map((section) => (
              <div key={section.heading} className="px-4 py-2 border-b border-slate-800 last:border-b-0">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest pt-1 mb-1">{section.heading}</p>
                {section.tabs.map((tab) => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                      activeTab === tab.id ? "bg-cyan-500/20 text-cyan-400" : "text-slate-300 hover:bg-slate-800"
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 shrink-0 bg-slate-900 border-r border-slate-800 p-4 flex-col">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-2 mb-3">Admin</p>
        {TAB_SECTIONS.map((section, i) => (
          <div key={section.heading} className={i > 0 ? "mt-4" : ""}>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-1">{section.heading}</p>
            {section.tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      <main className={`flex-1 p-4 md:p-6 overflow-y-auto ${activeTab === "wedstrijden" ? "" : "max-w-4xl"}`}>

        {/* Tab: Spelinstellingen */}
        {activeTab === "instellingen" && (
          <section className="bg-slate-900 neon-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-5">Spelinstellingen</h2>
            {!settings ? <p className="text-slate-500 text-sm">Laden...</p> : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={LABEL}>Budget (max. teamwaarde)</label>
                    <input type="number" value={settingsForm.budget} onChange={(e) => setSettingsForm({ ...settingsForm, budget: Number(e.target.value) })}
                      className={INPUT} min="1" />
                  </div>
                  <div>
                    <label className={LABEL}>Deadline (team invullen tot)</label>
                    <input type="datetime-local" value={settingsForm.deadline ?? ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, deadline: e.target.value || null })}
                      className={INPUT + " max-w-xs"} />
                    {settingsForm.deadline && (
                      <button onClick={() => setSettingsForm({ ...settingsForm, deadline: null })} className="text-xs text-slate-500 hover:text-slate-300 mt-1 transition-colors">Deadline verwijderen</button>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settingsForm.registrationOpen} onChange={(e) => setSettingsForm({ ...settingsForm, registrationOpen: e.target.checked })} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                    </label>
                    <span className="text-sm font-medium text-slate-300">Registratie open</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${settingsForm.registrationOpen ? "bg-green-900/40 text-green-400 border border-green-500/30" : "bg-red-900/40 text-red-400 border border-red-500/30"}`}>
                      {settingsForm.registrationOpen ? "Aan" : "Uit"}
                    </span>
                  </div>
                  {settingsForm.registrationOpen && settingsForm.deadline && new Date(settingsForm.deadline) < new Date() && (
                    <p className="mt-1.5 text-xs text-amber-400 bg-amber-900/20 border border-amber-500/30 px-3 py-2 rounded-lg">
                      Let op: de deadline ({new Date(settingsForm.deadline).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}) is al verstreken. Nieuwe aanmeldingen worden geblokkeerd totdat de deadline wordt aangepast of verwijderd.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settingsForm.captainEnabled} onChange={(e) => setSettingsForm({ ...settingsForm, captainEnabled: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                  <span className="text-sm font-medium text-slate-300">Aanvoerder verplicht</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${settingsForm.captainEnabled ? "bg-green-900/40 text-green-400 border border-green-500/30" : "bg-red-900/40 text-red-400 border border-red-500/30"}`}>
                    {settingsForm.captainEnabled ? "Aan" : "Uit"}
                  </span>
                  <span className="text-xs text-slate-500">— aanvoerder krijgt 2× punten</span>
                </div>
                <div>
                  <label className={LABEL}>Spelregels</label>
                  <textarea value={settingsForm.rulesText} onChange={(e) => setSettingsForm({ ...settingsForm, rulesText: e.target.value })} rows={12}
                    className={INPUT + " resize-y font-mono text-sm"}
                    placeholder={"## Spelregels\n\nSchrijf hier de spelregels in markdown-opmaak."} />
                  <p className="text-xs text-slate-500 mt-1.5">
                    Markdown: <span className="text-slate-400 font-mono">## Koptekst</span> · <span className="text-slate-400 font-mono">**vet**</span> · <span className="text-slate-400 font-mono">- lijstitem</span>
                  </p>
                </div>
                <div>
                  <label className={LABEL}>Algemene voorwaarden <span className="text-slate-600 font-normal">(/terms)</span></label>
                  <textarea value={settingsForm.termsText} onChange={(e) => setSettingsForm({ ...settingsForm, termsText: e.target.value })} rows={8}
                    className={INPUT + " resize-y font-mono text-sm"}
                    placeholder={"## Algemene voorwaarden\n\nSchrijf hier de algemene voorwaarden in markdown-opmaak."} />
                </div>
                <div>
                  <label className={LABEL}>Privacybeleid <span className="text-slate-600 font-normal">(/privacy)</span></label>
                  <textarea value={settingsForm.privacyText} onChange={(e) => setSettingsForm({ ...settingsForm, privacyText: e.target.value })} rows={8}
                    className={INPUT + " resize-y font-mono text-sm"}
                    placeholder={"## Privacybeleid\n\nSchrijf hier het privacybeleid in markdown-opmaak."} />
                </div>
                {settingsMsg && (
                  <p className={`text-sm px-3 py-2 rounded-lg border ${settingsMsg.type === "ok" ? "bg-green-900/20 text-green-400 border-green-500/30" : "bg-red-900/20 text-red-400 border-red-500/30"}`}>
                    {settingsMsg.text}
                  </p>
                )}
                <button onClick={saveSettings} disabled={settingsSaving} className={BTN_PRIMARY}>
                  {settingsSaving ? "Opslaan..." : "Instellingen opslaan"}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Tab: Spelersbeheer */}
        {activeTab === "spelers" && (
          <div className="space-y-5">
            <section className="bg-slate-900 neon-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Spelersbeheer</h2>
                <button onClick={openAdd} className={BTN_PRIMARY}>+ Nieuwe speler</button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <input type="text" placeholder="Zoek op naam..." value={filterName} onChange={(e) => setFilterName(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-44 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40" />
                <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40">
                  <option value="">Alle elftallen</option>
                  {TEAMS.map((t) => <option key={t} value={t}>{TEAM_LABEL[t]}</option>)}
                </select>
                <select value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40">
                  <option value="">Alle posities</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{POSITION_LABEL[p]}</option>)}
                </select>
                {(filterName || filterTeam || filterPosition) && (
                  <button onClick={() => { setFilterName(""); setFilterTeam(""); setFilterPosition(""); }}
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Wis filters</button>
                )}
              </div>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <span className="text-sm font-medium text-red-400">{selectedIds.size} speler{selectedIds.size !== 1 ? "s" : ""} geselecteerd</span>
                  <div className="flex-1" />
                  {confirmBulk ? (
                    <>
                      <span className="text-sm text-red-400">Zeker weten?</span>
                      <button onClick={bulkDelete} disabled={bulkDeleting} className={BTN_DANGER + " disabled:opacity-50"}>{bulkDeleting ? "Bezig..." : "Ja, verwijder"}</button>
                      <button onClick={() => setConfirmBulk(false)} className={BTN_SMALL}>Annuleer</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setConfirmBulk(true)} className={BTN_DANGER}>Verwijder selectie</button>
                      <button onClick={() => setSelectedIds(new Set())} className={BTN_SMALL}>Deselecteer</button>
                    </>
                  )}
                </div>
              )}

              {loadingPlayers ? (
                <p className="text-slate-500 text-sm py-4">Laden...</p>
              ) : filteredPlayers.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">Geen spelers gevonden.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-800">
                        <th className="pb-2 pr-3 w-8">
                          <input type="checkbox"
                            checked={filteredPlayers.length > 0 && filteredPlayers.every((p) => selectedIds.has(p.id))}
                            ref={(el) => { if (el) el.indeterminate = filteredPlayers.some((p) => selectedIds.has(p.id)) && !filteredPlayers.every((p) => selectedIds.has(p.id)); }}
                            onChange={toggleSelectAll} className="rounded accent-cyan-500" />
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
                        <tr key={player.id} className={`border-b border-slate-800/60 ${selectedIds.has(player.id) ? "bg-red-900/10" : "hover:bg-slate-800/30"}`}>
                          <td className="py-2 pr-3">
                            <input type="checkbox" checked={selectedIds.has(player.id)} onChange={() => toggleSelect(player.id)} className="rounded accent-cyan-500" />
                          </td>
                          <td className="py-2">
                            <div className="font-medium text-white">{player.name}</div>
                            <div className="text-xs text-slate-500 sm:hidden">{TEAM_LABEL[player.clubTeam]}</div>
                          </td>
                          <td className="py-2 text-slate-400">{POSITION_SHORT[player.position]}</td>
                          <td className="py-2 text-slate-400 hidden sm:table-cell">{TEAM_LABEL[player.clubTeam]}</td>
                          <td className="py-2 text-slate-400">€{player.value}</td>
                          <td className="py-2 text-right">
                            <button onClick={() => openPlayerStats(player)} className={BTN_SMALL}>Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-slate-600 mt-2">{filteredPlayers.length} van {players.length} spelers{selectedIds.size > 0 && ` · ${selectedIds.size} geselecteerd`}</p>
                </div>
              )}
            </section>

            <section className="bg-slate-900 neon-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1">Spelers importeren via Excel</h2>
              <p className="text-slate-500 text-sm mb-4">Upload een .xlsx bestand met kolommen: Naam, Positie (GK/DEF/MID/ATT), Team (ONE/TWO/THREE/FOUR/FIVE/DAMES), Waarde.</p>
              <div className="flex flex-wrap items-center gap-4">
                <input type="file" accept=".xlsx" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 file:transition-colors" />
                <button onClick={handleImport} disabled={!importFile || importing} className={BTN_PRIMARY}>{importing ? "Bezig..." : "Importeren"}</button>
              </div>
              {importResult && (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="font-semibold text-slate-300 mb-2 text-sm">Resultaat</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="bg-green-900/40 text-green-400 px-3 py-1 rounded-full text-xs border border-green-500/30">{importResult.imported} toegevoegd</span>
                    {importResult.alreadyPresent > 0 && <span className="bg-blue-900/40 text-blue-400 px-3 py-1 rounded-full text-xs border border-blue-500/30">{importResult.alreadyPresent} al aanwezig</span>}
                    {importResult.skipped > 0 && <span className="bg-amber-900/40 text-amber-400 px-3 py-1 rounded-full text-xs border border-amber-500/30">{importResult.skipped} overgeslagen</span>}
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30">
                      <p className="font-semibold text-red-400 text-sm mb-1">Fouten:</p>
                      <ul className="list-disc list-inside text-sm text-red-400/80 space-y-0.5">{importResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab: Wedstrijden */}
        {activeTab === "wedstrijden" && (
          <div className="flex gap-4 items-start">

            {/* Links: wedstrijdenoverzicht */}
            <section className="bg-slate-900 neon-border rounded-2xl p-6 flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Wedstrijden</h2>
              <button onClick={() => { loadAdminMatches(); loadPublishMoments(); }} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Vernieuwen</button>
            </div>

            {/* Wachtrij banner */}
            {(() => {
              const waiting = adminMatches.filter((m) => m.status === "APPROVED" || m.status === "CORRECTION");
              if (waiting.length === 0) return null;
              const oldest = waiting.reduce((a, b) => new Date(a.matchDate) < new Date(b.matchDate) ? a : b);
              const days = Math.floor((Date.now() - new Date(oldest.matchDate).getTime()) / 86400000);
              const urgent = days >= 7;
              return (
                <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 border text-sm flex-wrap ${urgent ? "bg-amber-900/20 border-amber-500/30 text-amber-300" : "bg-cyan-900/20 border-cyan-500/30 text-cyan-300"}`}>
                  <span className="flex-1">
                    <span className="font-semibold">{waiting.length} wedstrijd{waiting.length !== 1 ? "en" : ""}</span> wacht{waiting.length === 1 ? "" : "en"} op verwerking
                    {urgent && <span className="ml-2 text-amber-400 font-medium">· oudste al {days} dagen geleden gespeeld</span>}
                  </span>
                  <button onClick={selectAllApproved} className="px-3 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors">
                    Selecteer alle ({waiting.length})
                  </button>
                </div>
              );
            })()}
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <select value={matchFilterTeam} onChange={(e) => setMatchFilterTeam(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40">
                <option value="">Alle elftallen</option>
                {TEAMS.map((t) => <option key={t} value={t}>{TEAM_LABEL[t]}</option>)}
              </select>
              <select value={matchFilterStatus} onChange={(e) => setMatchFilterStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40">
                <option value="">Alle statussen</option>
                <option value="PENDING">Ingediend</option>
                <option value="APPROVED">Goedgekeurd</option>
                <option value="REJECTED">Afgekeurd</option>
                <option value="PROCESSED">Verwerkt</option>
                <option value="CORRECTION">Correctie</option>
              </select>
              {(matchFilterTeam || matchFilterStatus) && (
                <button onClick={() => { setMatchFilterTeam(""); setMatchFilterStatus(""); }} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Wis filters</button>
              )}
            </div>
            {/* Feedback */}
            {pointsMsg && (
              <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 mb-3 border text-sm ${pointsMsg.type === "ok" ? "bg-green-900/20 border-green-500/30 text-green-400" : "bg-red-900/20 border-red-500/30 text-red-400"}`}>
                <span className="flex-1">{pointsMsg.text}</span>
                <button onClick={() => setPointsMsg(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
              </div>
            )}
            {/* Actiebalk voor geselecteerde wedstrijden */}
            {processSelectedIds.size > 0 && (
              <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 mb-3 flex-wrap">
                <span className="text-sm text-slate-300 flex-1">{processSelectedIds.size} geselecteerd voor verwerking</span>
                <button onClick={processPoints} disabled={processing} className={BTN_PRIMARY + " disabled:opacity-40"}>
                  {processing ? "Verwerken..." : `Verwerk ${processSelectedIds.size} geselecteerde`}
                </button>
                <button onClick={() => setProcessSelectedIds(new Set())} className={BTN_SECONDARY}>Deselecteer</button>
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
                      <div key={m.id} className={`bg-slate-800/50 rounded-xl p-3 border transition-colors ${isProcessable && processSelectedIds.has(m.id) ? "border-cyan-500/50 bg-cyan-500/5" : "border-slate-700"}`}>
                        <div className="flex items-start gap-2 mb-2">
                          {isProcessable
                            ? <input type="checkbox" checked={processSelectedIds.has(m.id)} onChange={() => toggleProcessSelect(m.id)} className="mt-0.5 accent-cyan-500 shrink-0" />
                            : <span className="w-4 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-white text-sm truncate">{m.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{TEAM_LABEL[m.clubTeam]} · {new Date(m.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} · {m.homeAway === "HOME" ? "Thuis" : m.homeAway === "AWAY" ? "Uit" : "Neutraal"}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                                {(m.status === "APPROVED" || m.status === "CORRECTION") && (() => {
                                  const days = Math.floor((Date.now() - new Date(m.matchDate).getTime()) / 86400000);
                                  if (days < 3) return null;
                                  return <span className={`text-xs ${days >= 7 ? "text-amber-400" : "text-slate-500"}`}>{days} dagen geleden</span>;
                                })()}
                                <span className="text-sm font-bold text-slate-300">{m.homeAway === "AWAY" ? `${m.goalsConceded}–${m.goalsScored}` : `${m.goalsScored}–${m.goalsConceded}`}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="pl-6">
                          <div className="relative inline-block">
                            <button onClick={() => setMatchMenuId(matchMenuId === m.id ? null : m.id)} className={BTN_SMALL}>Acties ▾</button>
                            {matchMenuId === m.id && (
                              <div className="absolute left-0 top-8 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl min-w-[220px] overflow-hidden">
                                {m.status !== "PROCESSED" && m.status !== "CORRECTION" && <button onClick={() => { openEditMatch(m); setMatchMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">Bewerken</button>}
                                <button onClick={() => { openEditMatch(m); setMatchMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">Prestaties</button>
                                {m.status === "PENDING" && <button onClick={() => { approveMatch(m.id, "APPROVED"); setMatchMenuId(null); }} disabled={approvingId === m.id} className="w-full text-left px-4 py-2.5 text-sm text-green-400 hover:bg-slate-700 transition-colors disabled:opacity-50">Goedkeuren</button>}
                                {(m.status === "PENDING" || m.status === "APPROVED") && <button onClick={() => { approveMatch(m.id, "REJECTED"); setMatchMenuId(null); }} disabled={approvingId === m.id} className="w-full text-left px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-700 transition-colors disabled:opacity-50">Afkeuren</button>}
                                {m.status === "APPROVED" && publishMoments.filter(p => !p.publishedAt).length > 0 && (
                                  <div className="border-t border-slate-700">
                                    <p className="px-4 pt-2.5 pb-1 text-xs text-slate-500 font-semibold uppercase tracking-wide">Inplannen bij</p>
                                    {m.publishMomentId
                                      ? <button onClick={() => { assignToMoment(m.id, null); setMatchMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors">Verwijder uit wachtrij</button>
                                      : publishMoments.filter(p => !p.publishedAt).map(pm => (
                                          <button key={pm.id} onClick={() => { assignToMoment(m.id, pm.id); setMatchMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-slate-700 transition-colors">
                                            {pm.label}
                                          </button>
                                        ))
                                    }
                                  </div>
                                )}
                                {m.status === "PROCESSED" && <button onClick={() => { revertMatch(m.id); }} disabled={revertingMatchId === m.id} className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:bg-slate-700 transition-colors disabled:opacity-50">{revertingMatchId === m.id ? "Bezig..." : "Terugdraaien"}</button>}
                                {m.status === "CORRECTION" && <button onClick={() => { cancelCorrection(m.id); setMatchMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:bg-slate-700 transition-colors">Annuleer correctie</button>}
                                {m.status !== "PROCESSED" && <><div className="border-t border-slate-700" /><button onClick={() => deleteMatch(m.id)} disabled={deletingMatchId === m.id} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50">Verwijderen</button></>}
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
                          <input type="checkbox"
                            checked={filteredMatches.filter(m => m.status === "APPROVED" || m.status === "CORRECTION").length > 0 && filteredMatches.filter(m => m.status === "APPROVED" || m.status === "CORRECTION").every(m => processSelectedIds.has(m.id))}
                            ref={(el) => { if (el) { const p = filteredMatches.filter(m => m.status === "APPROVED" || m.status === "CORRECTION"); el.indeterminate = p.some(m => processSelectedIds.has(m.id)) && !p.every(m => processSelectedIds.has(m.id)); } }}
                            onChange={toggleAllProcessSelect} className="accent-cyan-500" />
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
                          <tr key={m.id} className={`border-b border-slate-800/60 ${isProcessable && processSelectedIds.has(m.id) ? "bg-cyan-500/5" : "hover:bg-slate-800/30"}`}>
                            <td className="py-2">
                              {isProcessable && <input type="checkbox" checked={processSelectedIds.has(m.id)} onChange={() => toggleProcessSelect(m.id)} className="accent-cyan-500" />}
                            </td>
                            <td className="py-2 text-slate-400 text-xs whitespace-nowrap">{new Date(m.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</td>
                            <td className="py-2 text-slate-400 whitespace-nowrap">{m.homeAway === "AWAY" ? m.name : (TEAM_LABEL[m.clubTeam] ?? m.clubTeam)}</td>
                            <td className="py-2 font-medium text-white whitespace-nowrap">{m.homeAway === "HOME" ? m.name : (TEAM_LABEL[m.clubTeam] ?? m.clubTeam)}</td>
                            <td className="py-2 text-slate-400 whitespace-nowrap">{m.homeAway === "AWAY" ? `${m.goalsConceded}–${m.goalsScored}` : `${m.goalsScored}–${m.goalsConceded}`}<span className="text-xs text-slate-600 ml-1.5">({m.performances.filter(p => p.played).length})</span></td>
                            <td className="py-2 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${STATUS_STYLE[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                                {m.publishMoment && !m.publishMoment.publishedAt && (
                                  <span className="text-xs text-cyan-400 truncate max-w-[140px]">📅 {m.publishMoment.label}</span>
                                )}
                                {(m.status === "APPROVED" || m.status === "CORRECTION") && !m.publishMomentId && (() => {
                                  const days = Math.floor((Date.now() - new Date(m.matchDate).getTime()) / 86400000);
                                  if (days < 3) return null;
                                  return <span className={`text-xs ${days >= 7 ? "text-amber-400" : "text-slate-500"}`}>{days}d</span>;
                                })()}
                              </div>
                            </td>
                            <td className="py-2 text-right">
                              <div className="relative inline-block">
                                <button onClick={() => setMatchMenuId(matchMenuId === m.id ? null : m.id)} className={BTN_SMALL}>Acties ▾</button>
                                {matchMenuId === m.id && (
                                  <div className="absolute right-0 top-8 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl min-w-[220px] overflow-hidden">
                                    {m.status !== "PROCESSED" && m.status !== "CORRECTION" && <button onClick={() => { openEditMatch(m); setMatchMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">Bewerken</button>}
                                    <button onClick={() => { openEditMatch(m); setMatchMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">Prestaties</button>
                                    {m.status === "PENDING" && <button onClick={() => { approveMatch(m.id, "APPROVED"); setMatchMenuId(null); }} disabled={approvingId === m.id} className="w-full text-left px-4 py-2.5 text-sm text-green-400 hover:bg-slate-700 transition-colors disabled:opacity-50">Goedkeuren</button>}
                                    {(m.status === "PENDING" || m.status === "APPROVED") && <button onClick={() => { approveMatch(m.id, "REJECTED"); setMatchMenuId(null); }} disabled={approvingId === m.id} className="w-full text-left px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-700 transition-colors disabled:opacity-50">Afkeuren</button>}
                                    {m.status === "APPROVED" && publishMoments.filter(p => !p.publishedAt).length > 0 && (
                                      <div className="border-t border-slate-700">
                                        <p className="px-4 pt-2.5 pb-1 text-xs text-slate-500 font-semibold uppercase tracking-wide">Inplannen bij</p>
                                        {m.publishMomentId
                                          ? <button onClick={() => { assignToMoment(m.id, null); setMatchMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors">Verwijder uit wachtrij</button>
                                          : publishMoments.filter(p => !p.publishedAt).map(pm => (
                                              <button key={pm.id} onClick={() => { assignToMoment(m.id, pm.id); setMatchMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-slate-700 transition-colors">
                                                {pm.label}
                                              </button>
                                            ))
                                        }
                                      </div>
                                    )}
                                    {m.status === "PROCESSED" && <button onClick={() => { revertMatch(m.id); }} disabled={revertingMatchId === m.id} className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:bg-slate-700 transition-colors disabled:opacity-50">{revertingMatchId === m.id ? "Bezig..." : "Terugdraaien"}</button>}
                                    {m.status === "CORRECTION" && <button onClick={() => { cancelCorrection(m.id); setMatchMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:bg-slate-700 transition-colors">Annuleer correctie</button>}
                                    {m.status !== "PROCESSED" && <><div className="border-t border-slate-700" /><button onClick={() => deleteMatch(m.id)} disabled={deletingMatchId === m.id} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50">Verwijderen</button></>}
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
                  <button onClick={() => { setNewMomentForm({ label: "", scheduledAt: "" }); setNewMomentModal(true); }} className="px-2.5 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors">+ Nieuw</button>
                </div>
                {(() => {
                  const pending = publishMoments.filter(pm => !pm.publishedAt);
                  const processed = publishMoments.filter(pm => pm.publishedAt);
                  return (
                    <div className="space-y-2">
                      {pending.length === 0 && processed.length === 0 && (
                        <p className="text-slate-500 text-xs">Nog geen momenten aangemaakt.</p>
                      )}
                      {pending.map((pm) => {
                        const approvedInMoment = adminMatches.filter((m) => m.publishMomentId === pm.id && m.status === "APPROVED");
                        const allInMoment = adminMatches.filter((m) => m.publishMomentId === pm.id);
                        const isPast = new Date(pm.scheduledAt) <= new Date();
                        return (
                          <div key={pm.id} className={`rounded-xl border p-3 ${isPast ? "border-amber-500/30 bg-amber-900/10" : "border-slate-700 bg-slate-800/50"}`}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-semibold text-white text-sm leading-tight">{pm.label}</span>
                              {isPast
                                ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-500/30 shrink-0">Wacht</span>
                                : <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 shrink-0">Gepland</span>
                              }
                            </div>
                            <p className="text-xs text-slate-500 mb-2">
                              {new Date(pm.scheduledAt).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" })}
                            </p>
                            <p className="text-xs text-slate-400 mb-2">
                              {allInMoment.length} wedstrijd{allInMoment.length !== 1 ? "en" : ""}
                              {approvedInMoment.length > 0 && <span className="text-green-400 ml-1">· {approvedInMoment.length} klaar</span>}
                            </p>
                            {allInMoment.length > 0 && (
                              <div className="space-y-0.5 mb-2">
                                {allInMoment.map((m) => (
                                  <div key={m.id} className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.status === "APPROVED" ? "bg-green-400" : m.status === "PENDING" ? "bg-amber-400" : "bg-slate-600"}`} />
                                    <span className="text-xs text-slate-400 truncate">{TEAM_LABEL[m.clubTeam] ?? m.clubTeam} vs {m.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => publishMoment(pm.id)}
                                disabled={publishingMomentId === pm.id || approvedInMoment.length === 0}
                                className="flex-1 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-40"
                              >
                                {publishingMomentId === pm.id ? "..." : `Publiceer (${approvedInMoment.length})`}
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
                            onClick={() => setShowProcessedMoments(v => !v)}
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
                                    <span className="text-xs font-medium text-slate-400 truncate block">{pm.label}</span>
                                    <span className="text-xs text-slate-600">
                                      {new Date(pm.publishedAt!).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" })}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => deleteMoment(pm.id)}
                                    disabled={deletingMomentId === pm.id}
                                    title="Verwijderen"
                                    className="px-2 py-1 text-xs bg-red-900/20 text-red-500 rounded hover:bg-red-900/40 transition-colors border border-red-500/20 shrink-0"
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

          </div>
        )}

        {/* Tab: Puntensysteem */}
        {activeTab === "puntensysteem" && (
          <section className="bg-slate-900 neon-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-5">Puntensysteem</h2>
            {loadingPoints ? (
              <p className="text-slate-500 text-sm">Laden...</p>
            ) : pointsConfig.length === 0 ? (
              <p className="text-slate-500 text-sm">Geen configuratie gevonden. Voer het seed script uit.</p>
            ) : (
              <div>
                <div className="overflow-x-auto mb-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-800">
                        <th className="pb-2 font-semibold">Actie</th>
                        <th className="pb-2 font-semibold text-center w-16">GK</th>
                        <th className="pb-2 font-semibold text-center w-16">DEF</th>
                        <th className="pb-2 font-semibold text-center w-16">MID</th>
                        <th className="pb-2 font-semibold text-center w-16">ATT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...pointsConfig].sort((a, b) => {
                        const ORDER = ["goal","penaltyGoal","assist","ownGoal","win","draw","yellowCard","redCard","goalsConceded","cleanSheet"];
                        return (ORDER.indexOf(a.id) ?? 99) - (ORDER.indexOf(b.id) ?? 99);
                      }).map((cfg) => (
                        <tr key={cfg.id} className="border-b border-slate-800/60">
                          <td className="py-2 font-medium text-white">{cfg.label}</td>
                          {(["gkPoints", "defPoints", "midPoints", "attPoints"] as const).map((field) => (
                            <td key={field} className="py-2 text-center">
                              {cfg[field] === null && !["goal", "penaltyGoal", "assist", "ownGoal", "win", "draw", "yellowCard", "redCard"].includes(cfg.id) ? (
                                <span className="text-slate-700 text-xs">N/v.t.</span>
                              ) : (
                                <input type="number" value={cfg[field] ?? ""}
                                  onChange={(e) => updatePointsCell(cfg.id, field, e.target.value)}
                                  className="w-10 sm:w-14 bg-slate-800 border border-slate-700 text-white rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/40" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pointsMsg && (
                  <p className={`text-sm px-3 py-2 rounded-lg mb-3 border ${pointsMsg.type === "ok" ? "bg-green-900/20 text-green-400 border-green-500/30" : "bg-red-900/20 text-red-400 border-red-500/30"}`}>
                    {pointsMsg.text}
                  </p>
                )}
                <button onClick={savePointsConfig} disabled={pointsSaving} className={BTN_PRIMARY}>
                  {pointsSaving ? "Opslaan..." : "Puntentabel opslaan"}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Tab: Gebruikers */}
        {activeTab === "gebruikers" && (
          <section className="bg-slate-900 neon-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Gebruikers</h2>
              <button onClick={loadUsers} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Vernieuwen</button>
            </div>
            {loadingUsers ? (
              <p className="text-slate-500 text-sm py-4">Laden...</p>
            ) : users.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">Geen gebruikers gevonden.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-800">
                      <th className="pb-2 font-semibold whitespace-nowrap">Naam</th>
                      <th className="pb-2 font-semibold whitespace-nowrap">Rol</th>
                      <th className="pb-2 font-semibold text-right whitespace-nowrap">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                        <td className="py-2 font-medium text-white whitespace-nowrap">{user.name ?? <span className="text-slate-500 italic">Geen naam</span>}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                              user.role === "ADMIN"
                                ? "bg-purple-900/40 text-purple-400 border-purple-500/30"
                                : user.role === "MANAGER"
                                ? "bg-blue-900/40 text-blue-400 border-blue-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}>
                              {user.role === "ADMIN" ? "Admin" : user.role === "MANAGER" ? "Beheerder" : "Deelnemer"}
                            </span>
                            {user.managedTeam && <span className="text-xs text-slate-500">{TEAM_LABEL[user.managedTeam] ?? user.managedTeam}</span>}
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          <button onClick={() => openRoleModal(user)} className={BTN_SMALL}>Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-slate-600 mt-2">{users.length} gebruikers</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modal: speler toevoegen / bewerken */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-4">{modal === "add" ? "Nieuwe speler toevoegen" : "Speler bewerken"}</h3>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Naam</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT} placeholder="Voornaam Achternaam" />
              </div>
              <div>
                <label className={LABEL}>Weergavenaam op veld <span className="text-slate-600 font-normal">(optioneel)</span></label>
                <input type="text" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} className={INPUT} placeholder="bijv. J. de Vries" />
                <p className="text-xs text-slate-600 mt-1">Wordt getoond op het voetbalveld. Laat leeg om de volledige naam te gebruiken.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Positie</label>
                  <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={SELECT}>
                    {POSITIONS.map((p) => <option key={p} value={p}>{POSITION_LABEL[p]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Elftal</label>
                  <select value={form.clubTeam} onChange={(e) => setForm({ ...form, clubTeam: e.target.value })} className={SELECT}>
                    {TEAMS.map((t) => <option key={t} value={t}>{TEAM_LABEL[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Waarde</label>
                <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={INPUT} placeholder="bv. 120" min="1" />
              </div>
              {formError && <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(null)} className={BTN_SECONDARY}>Annuleer</button>
              <button onClick={savePlayer} disabled={saving} className={BTN_PRIMARY}>{saving ? "Opslaan..." : "Opslaan"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: gebruiker details + bewerken */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{roleModal.name ?? roleModal.email}</h3>
                <p className="text-sm text-slate-500">{roleModal.email}</p>
              </div>
              <button onClick={() => setRoleModal(null)} className="text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors">×</button>
            </div>
            {/* Team info (read-only) */}
            <div className="mb-5 pb-5 border-b border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Fantasy team</p>
              {roleModal.teamEntries.length === 0 ? (
                <p className="text-slate-500 text-sm">Geen team ingevuld.</p>
              ) : (() => {
                const entry = roleModal.teamEntries[0];
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {entry.formation && <span className="bg-cyan-900/40 text-cyan-400 px-2 py-0.5 rounded-full text-xs font-semibold border border-cyan-500/30">{entry.formation.code}</span>}
                      {entry.locked && <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-xs font-medium border border-slate-700">Ingediend</span>}
                      <span className="text-xs text-slate-500">{entry.players.length} spelers</span>
                    </div>
                    {entry.players.length > 0 && (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-600 border-b border-slate-800">
                            <th className="pb-1 font-semibold">Naam</th>
                            <th className="pb-1 font-semibold">Pos.</th>
                            <th className="pb-1 font-semibold">Elftal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.players.map((tp) => (
                            <tr key={tp.slotIndex} className="border-b border-slate-800/40">
                              <td className="py-1 text-slate-300">{tp.player.name}</td>
                              <td className="py-1 text-slate-500">{POSITION_SHORT[tp.player.position] ?? tp.player.position}</td>
                              <td className="py-1 text-slate-500">{TEAM_LABEL[tp.player.clubTeam] ?? tp.player.clubTeam}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })()}
            </div>
            {/* Edit form */}
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Instellingen</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Naam</label>
                  <input type="text" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} className={INPUT} placeholder="Voornaam Achternaam" />
                </div>
                <div>
                  <label className={LABEL}>E-mailadres</label>
                  <input type="email" value={roleForm.email} onChange={(e) => setRoleForm({ ...roleForm, email: e.target.value })} className={INPUT} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Rol</label>
                <select value={roleForm.role} onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })} className={SELECT}>
                  <option value="USER">Deelnemer</option>
                  <option value="MANAGER">Teambeheerder</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {roleForm.role === "MANAGER" && (
                <div>
                  <label className={LABEL}>Elftal</label>
                  <select value={roleForm.managedTeam} onChange={(e) => setRoleForm({ ...roleForm, managedTeam: e.target.value })} className={SELECT}>
                    {TEAMS.map((t) => <option key={t} value={t}>{TEAM_LABEL[t]}</option>)}
                  </select>
                </div>
              )}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative inline-flex items-center">
                  <input type="checkbox" checked={roleForm.isParticipant} onChange={(e) => setRoleForm({ ...roleForm, isParticipant: e.target.checked })} className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-300">Doet mee aan tussenstand</span>
                  <p className="text-xs text-slate-600">Verschijnt in de tussenstand als deelnemer</p>
                </div>
              </label>
              {roleError && <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">{roleError}</p>}
            </div>

            {/* Aanmeldlink */}
            <div className="mt-5 pt-5 border-t border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Aanmeldlink</p>
              <p className="text-xs text-slate-500 mb-3">Genereer een eenmalige link (24 uur geldig). Stuur via WhatsApp. Gebruiker wordt gedwongen een wachtwoord in te stellen.</p>
              <button
                onClick={() => generateLoginLink(roleModal!.id)}
                disabled={linkGenerating}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
              >
                {linkGenerating ? "Genereren..." : "Aanmeldlink genereren"}
              </button>
              {generatedLink && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={generatedLink}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-400 font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => { navigator.clipboard.writeText(generatedLink); }}
                      className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      Kopieer
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Link is 24 uur geldig en kan maar één keer gebruikt worden.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setRoleModal(null)} className={BTN_SECONDARY}>Annuleer</button>
              <button onClick={saveRole} disabled={roleSaving} className={BTN_PRIMARY}>{roleSaving ? "Opslaan..." : "Opslaan"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop: sluit dropdown menu bij klik buiten */}
      {matchMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setMatchMenuId(null)} />
      )}

      {/* Modal: wedstrijd bewerken / prestaties bekijken */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">{editMatchReadOnly ? "Prestaties bekijken" : "Wedstrijd bewerken"}</h3>
                <p className="text-sm text-slate-500">{TEAM_LABEL[editingMatch.clubTeam] ?? editingMatch.clubTeam}</p>
              </div>
              <button onClick={() => setEditingMatch(null)} className="text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors">×</button>
            </div>

            {/* Wedstrijd details: bewerkbaar of readonly */}
            {editMatchReadOnly ? (
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm"><span className="text-slate-500">Tegenstander: </span><span className="text-white font-medium">{editingMatch.name}</span></div>
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm"><span className="text-slate-500">Datum: </span><span className="text-white">{new Date(editingMatch.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm"><span className="text-slate-500">Uitslag: </span><span className="text-white font-bold">{editingMatch.homeAway === "AWAY" ? `${editingMatch.goalsConceded}–${editingMatch.goalsScored}` : `${editingMatch.goalsScored}–${editingMatch.goalsConceded}`}</span></div>
                <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm"><span className="text-slate-500">Status: </span><span className={`font-medium ${STATUS_STYLE[editingMatch.status].includes("orange") ? "text-orange-400" : STATUS_STYLE[editingMatch.status].includes("blue") ? "text-blue-400" : "text-slate-300"}`}>{STATUS_LABEL[editingMatch.status]}</span></div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div>
                  <label className={LABEL}>Tegenstander</label>
                  <input type="text" value={editMatchForm.name} onChange={(e) => setEditMatchForm({ ...editMatchForm, name: e.target.value })} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Datum & tijd</label>
                  <input type="datetime-local" value={editMatchForm.matchDate} onChange={(e) => setEditMatchForm({ ...editMatchForm, matchDate: e.target.value })} className={INPUT} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={LABEL}>Thuis/Uit</label>
                    <select value={editMatchForm.homeAway} onChange={(e) => {
                      const newHA = e.target.value;
                      // Als thuis↔uit wisselt: swap de goals zodat de stand op het scorebord klopt
                      const shouldSwap = (editMatchForm.homeAway === "HOME" && newHA === "AWAY") || (editMatchForm.homeAway === "AWAY" && newHA === "HOME");
                      setEditMatchForm({ ...editMatchForm, homeAway: newHA, ...(shouldSwap ? { thuisGoals: editMatchForm.uitGoals, uitGoals: editMatchForm.thuisGoals } : {}) });
                    }} className={SELECT}>
                      <option value="HOME">Thuis</option>
                      <option value="AWAY">Uit</option>
                      <option value="NEUTRAL">Neutraal</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Goals thuisploeg</label>
                    <input type="number" value={editMatchForm.thuisGoals} onChange={(e) => setEditMatchForm({ ...editMatchForm, thuisGoals: Number(e.target.value) })} className={INPUT} min="0" />
                  </div>
                  <div>
                    <label className={LABEL}>Goals uitploeg</label>
                    <input type="number" value={editMatchForm.uitGoals} onChange={(e) => setEditMatchForm({ ...editMatchForm, uitGoals: Number(e.target.value) })} className={INPUT} min="0" />
                  </div>
                </div>
                {editMatchError && <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">{editMatchError}</p>}
              </div>
            )}

            {/* Spelersbijdragen */}
            <div className="border-t border-slate-700 pt-5">
              <p className="text-sm font-semibold text-slate-400 mb-3">Spelersbijdragen</p>
              {editingMatch.performances.length === 0 ? (
                <p className="text-slate-500 text-sm mb-4">Nog geen prestaties ingevoerd.</p>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-sm min-w-[520px]">
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
                        const ed = editPerfsData[p.playerId] ?? { played: p.played, goals: p.goals, penaltyGoals: p.penaltyGoals, assists: p.assists, ownGoals: p.ownGoals, yellowCards: p.yellowCards, redCard: p.redCard };
                        return (
                          <tr key={p.playerId} className={`border-b border-slate-800/60 ${!ed.played ? "opacity-40" : ""}`}>
                            <td className="py-1.5 font-medium text-white">
                              {p.player.name}
                              <span className="text-slate-500 text-xs ml-1">{POSITION_LABEL[p.player.position] ?? p.player.position}</span>
                            </td>
                            <td className="py-1.5 text-center"><input type="checkbox" checked={ed.played} disabled={editMatchReadOnly} onChange={(e) => updatePerfField(p.playerId, "played", e.target.checked)} className="accent-cyan-500 disabled:opacity-60" /></td>
                            <td className="py-1.5 text-center"><input type="number" value={ed.goals} min={0} readOnly={editMatchReadOnly} onChange={(e) => updatePerfField(p.playerId, "goals", Number(e.target.value))} className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`} /></td>
                            <td className="py-1.5 text-center"><input type="number" value={ed.penaltyGoals} min={0} readOnly={editMatchReadOnly} onChange={(e) => updatePerfField(p.playerId, "penaltyGoals", Number(e.target.value))} className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`} /></td>
                            <td className="py-1.5 text-center"><input type="number" value={ed.assists} min={0} readOnly={editMatchReadOnly} onChange={(e) => updatePerfField(p.playerId, "assists", Number(e.target.value))} className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`} /></td>
                            <td className="py-1.5 text-center"><input type="number" value={ed.ownGoals} min={0} readOnly={editMatchReadOnly} onChange={(e) => updatePerfField(p.playerId, "ownGoals", Number(e.target.value))} className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`} /></td>
                            <td className="py-1.5 text-center"><input type="number" value={ed.yellowCards} min={0} max={2} readOnly={editMatchReadOnly} onChange={(e) => updatePerfField(p.playerId, "yellowCards", Number(e.target.value))} className={`w-10 text-white text-center rounded px-1 py-0.5 text-xs ${editMatchReadOnly ? "bg-slate-800 opacity-60" : "bg-slate-700"}`} /></td>
                            <td className="py-1.5 text-center"><input type="checkbox" checked={ed.redCard} disabled={editMatchReadOnly} onChange={(e) => updatePerfField(p.playerId, "redCard", e.target.checked)} className="accent-cyan-500 disabled:opacity-60" /></td>
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
                <button onClick={() => setEditingMatch(null)} className={BTN_SECONDARY}>Sluiten</button>
              ) : (
                <>
                  <button onClick={() => setEditingMatch(null)} className={BTN_SECONDARY}>Annuleer</button>
                  <button onClick={saveAll} disabled={editMatchSaving} className={BTN_PRIMARY}>{editMatchSaving ? "Opslaan..." : "Opslaan"}</button>
                </>
              )}
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
                <p className="text-sm text-slate-500">{POSITION_LABEL[playerStatsModal.position]} · {TEAM_LABEL[playerStatsModal.clubTeam]}</p>
              </div>
              <button onClick={() => setPlayerStatsModal(null)} className="text-slate-500 hover:text-slate-300 text-xl leading-none mt-0.5">×</button>
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
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Seizoen totaal</p>
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
                          ...(["GK","DEF"].includes(playerStatsModal.position) ? [{ label: "Clean sheets", value: playerStats.seasonStats.cleanSheets }] : []),
                        ].map((s) => (
                          <div key={s.label} className={`rounded-xl p-3 text-center border ${s.highlight ? "bg-cyan-900/20 border-cyan-500/30" : "bg-slate-800/50 border-slate-700"}`}>
                            <p className={`text-lg font-bold ${s.highlight ? "text-cyan-400" : "text-white"}`}>{s.value}</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per wedstrijd */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Per verwerkte wedstrijd</p>
                    {playerStats.performances.length === 0 ? (
                      <p className="text-slate-500 text-sm">Nog geen verwerkte wedstrijden.</p>
                    ) : (
                      <div className="space-y-2">
                        {playerStats.performances.map((p) => (
                          <div key={p.matchId} className={`rounded-xl border p-3 ${!p.played ? "border-slate-800 opacity-50" : "border-slate-700 bg-slate-800/40"}`}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <p className="font-medium text-white text-sm">
                                  {TEAM_LABEL[p.clubTeam] ?? p.clubTeam} {p.homeAway === "HOME" ? "vs" : "@"} {p.matchName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(p.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                                  {" · "}
                                  {p.homeAway === "AWAY" ? `${p.goalsConceded}–${p.goalsScored}` : `${p.goalsScored}–${p.goalsConceded}`}
                                  {" · "}
                                  {p.played ? (p.won ? "Gewonnen" : p.drew ? "Gelijkspel" : "Verloren") : "Niet gespeeld"}
                                </p>
                              </div>
                              <span className={`text-lg font-black shrink-0 ${p.points > 0 ? "text-cyan-400" : p.points < 0 ? "text-red-400" : "text-slate-500"}`}>
                                {p.points > 0 ? "+" : ""}{p.points}
                              </span>
                            </div>
                            {p.played && Object.keys(p.breakdown).length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(p.breakdown).map(([label, pts]) => (
                                  <span key={label} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${pts > 0 ? "bg-green-900/20 border-green-500/20 text-green-400" : "bg-red-900/20 border-red-500/20 text-red-400"}`}>
                                    {label}: {pts > 0 ? "+" : ""}{pts}
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
              <button onClick={() => setPlayerStatsModal(null)} className={BTN_SECONDARY}>Sluiten</button>
              <button onClick={() => { const p = playerStatsModal; setPlayerStatsModal(null); openEdit(p!); }} className={BTN_PRIMARY}>Bewerken</button>
              <div className="ml-auto">
                {confirmDeleteId === playerStatsModal.id ? (
                  <span className="flex items-center gap-2">
                    <span className="text-sm text-red-400">Zeker weten?</span>
                    <button onClick={() => { deletePlayer(playerStatsModal.id); setPlayerStatsModal(null); }} disabled={deletingId === playerStatsModal.id} className="text-sm text-red-400 hover:text-red-300 transition-colors">{deletingId === playerStatsModal.id ? "..." : "Ja"}</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Nee</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDeleteId(playerStatsModal.id)} className={BTN_DANGER}>Verwijderen</button>
                )}
              </div>
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
              <button onClick={() => setNewMomentModal(false)} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
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
              <button onClick={() => setNewMomentModal(false)} className={BTN_SECONDARY}>Annuleer</button>
              <button onClick={createMoment} disabled={newMomentSaving || !newMomentForm.label || !newMomentForm.scheduledAt} className={BTN_PRIMARY}>
                {newMomentSaving ? "Aanmaken..." : "Aanmaken"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
