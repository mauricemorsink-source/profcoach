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

type AdminMatch = {
  id: string;
  name: string;
  clubTeam: string;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  matchDate: string;
  goalsScored: number;
  goalsConceded: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
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
  PENDING: "Ingediend", APPROVED: "Goedgekeurd", REJECTED: "Afgekeurd", PROCESSED: "Verwerkt",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-900/40 text-amber-400 border border-amber-500/30",
  APPROVED: "bg-green-900/40 text-green-400 border border-green-500/30",
  REJECTED: "bg-red-900/40 text-red-400 border border-red-500/30",
  PROCESSED: "bg-blue-900/40 text-blue-400 border border-blue-500/30",
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

  // Points config
  const [pointsConfig, setPointsConfig] = useState<PointsConfig[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [pointsSaving, setPointsSaving] = useState(false);
  const [pointsMsg, setPointsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  // Admin matches
  const [adminMatches, setAdminMatches] = useState<AdminMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [viewingMatchPerfs, setViewingMatchPerfs] = useState<AdminMatch | null>(null);
  const [matchFilterTeam, setMatchFilterTeam] = useState("");
  const [matchFilterStatus, setMatchFilterStatus] = useState("");
  const [editingMatch, setEditingMatch] = useState<AdminMatch | null>(null);
  const [editMatchForm, setEditMatchForm] = useState({ name: "", matchDate: "", goalsScored: 0, goalsConceded: 0, homeAway: "HOME" });
  const [editMatchSaving, setEditMatchSaving] = useState(false);
  const [editMatchError, setEditMatchError] = useState("");

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
    if (res.ok) setAdminMatches(await res.json());
    setLoadingMatches(false);
  }

  useEffect(() => { loadPlayers(); loadSettings(); }, []);

  useEffect(() => {
    if (activeTab === "gebruikers" && users.length === 0) loadUsers();
    if (activeTab === "puntensysteem" && pointsConfig.length === 0) loadPointsConfig();
    if (activeTab === "wedstrijden") loadAdminMatches();
  }, [activeTab]);

  const filteredPlayers = players.filter((p) => {
    if (filterName && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterTeam && p.clubTeam !== filterTeam) return false;
    if (filterPosition && p.position !== filterPosition) return false;
    return true;
  });

  const filteredMatches = adminMatches.filter((m) =>
    (!matchFilterTeam || m.clubTeam === matchFilterTeam) &&
    (!matchFilterStatus || m.status === matchFilterStatus)
  );

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
    const res = await fetch("/api/admin/process-points", { method: "POST" });
    const data = await res.json(); setProcessing(false);
    if (!res.ok) { setPointsMsg({ type: "err", text: data.error || "Verwerking mislukt" }); }
    else { setPointsMsg({ type: "ok", text: `${data.processed} wedstrijden verwerkt, ${data.playersUpdated} spelers bijgewerkt` }); }
  }

  async function approveMatch(id: string, status: "APPROVED" | "REJECTED") {
    setApprovingId(id);
    await fetch(`/api/admin/matches/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setApprovingId(null); await loadAdminMatches();
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
    setRoleError(""); setRoleModal(user);
  }

  function openEditMatch(m: AdminMatch) {
    setEditMatchForm({ name: m.name, matchDate: m.matchDate.slice(0, 16), goalsScored: m.goalsScored, goalsConceded: m.goalsConceded, homeAway: m.homeAway });
    setEditMatchError(""); setEditingMatch(m);
  }

  async function saveEditMatch() {
    if (!editingMatch) return;
    setEditMatchSaving(true); setEditMatchError("");
    const res = await fetch(`/api/admin/matches/${editingMatch.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editMatchForm.name, matchDate: editMatchForm.matchDate, goalsScored: Number(editMatchForm.goalsScored), goalsConceded: Number(editMatchForm.goalsConceded), homeAway: editMatchForm.homeAway }) });
    const data = await res.json(); setEditMatchSaving(false);
    if (!res.ok) { setEditMatchError(data.error || "Opslaan mislukt"); return; }
    setEditingMatch(null); await loadAdminMatches();
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

      <main className="flex-1 p-4 md:p-6 max-w-4xl overflow-y-auto">

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
                        <th className="pb-2 font-semibold">Positie</th>
                        <th className="pb-2 font-semibold">Elftal</th>
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
                          <td className="py-2 font-medium text-white">{player.name}</td>
                          <td className="py-2 text-slate-400">{POSITION_SHORT[player.position]}</td>
                          <td className="py-2 text-slate-400">{TEAM_LABEL[player.clubTeam]}</td>
                          <td className="py-2 text-slate-400">€{player.value}</td>
                          <td className="py-2 text-right">
                            <div className="flex justify-end gap-2 items-center">
                              <button onClick={() => openEdit(player)} className="text-xs text-slate-500 hover:text-blue-400 transition-colors px-1">✎</button>
                              {confirmDeleteId === player.id ? (
                                <span className="flex items-center gap-1">
                                  <button onClick={() => deletePlayer(player.id)} disabled={deletingId === player.id} className="text-xs text-red-400 hover:text-red-300 transition-colors">{deletingId === player.id ? "..." : "Ja"}</button>
                                  <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Nee</button>
                                </span>
                              ) : (
                                <button onClick={() => setConfirmDeleteId(player.id)} className="text-xs text-slate-700 hover:text-red-400 transition-colors px-1">✕</button>
                              )}
                            </div>
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
          <section className="bg-slate-900 neon-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Wedstrijden</h2>
              <button onClick={loadAdminMatches} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Vernieuwen</button>
            </div>
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
              </select>
              {(matchFilterTeam || matchFilterStatus) && (
                <button onClick={() => { setMatchFilterTeam(""); setMatchFilterStatus(""); }} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Wis filters</button>
              )}
            </div>
            {loadingMatches ? (
              <p className="text-slate-500 text-sm py-4">Laden...</p>
            ) : filteredMatches.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">Geen wedstrijden gevonden.</p>
            ) : (
              <>
                {/* Mobiel: kaartjes */}
                <div className="md:hidden space-y-2">
                  {filteredMatches.map((m) => (
                    <div key={m.id} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-medium text-white text-sm truncate">{m.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {TEAM_LABEL[m.clubTeam]} · {new Date(m.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} · {m.homeAway === "HOME" ? "Thuis" : m.homeAway === "AWAY" ? "Uit" : "Neutraal"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                          <span className="text-sm font-bold text-slate-300">{m.goalsScored}–{m.goalsConceded}</span>
                          <span className="text-xs text-slate-500">{m.performances.filter(p => p.played).length} spelers</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => openEditMatch(m)} className={BTN_SMALL}>Bewerken</button>
                        <button onClick={() => setViewingMatchPerfs(m)} className={BTN_SMALL}>Prestaties</button>
                        {m.status === "PENDING" && (
                          <>
                            <button onClick={() => approveMatch(m.id, "APPROVED")} disabled={approvingId === m.id} className="px-2 py-1 text-xs bg-green-900/40 text-green-400 rounded hover:bg-green-900/60 font-medium border border-green-500/30 disabled:opacity-50 transition-colors">Goedkeuren</button>
                            <button onClick={() => approveMatch(m.id, "REJECTED")} disabled={approvingId === m.id} className={BTN_DANGER + " disabled:opacity-50"}>Afkeuren</button>
                          </>
                        )}
                        {m.status === "APPROVED" && (
                          <button onClick={() => approveMatch(m.id, "REJECTED")} disabled={approvingId === m.id} className={BTN_DANGER + " disabled:opacity-50"}>Afkeuren</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: tabel */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-800">
                        <th className="pb-2 font-semibold whitespace-nowrap">Datum</th>
                        <th className="pb-2 font-semibold whitespace-nowrap">Elftal</th>
                        <th className="pb-2 font-semibold whitespace-nowrap">Tegenstander</th>
                        <th className="pb-2 font-semibold whitespace-nowrap">T/U</th>
                        <th className="pb-2 font-semibold whitespace-nowrap">Score</th>
                        <th className="pb-2 font-semibold whitespace-nowrap">Status</th>
                        <th className="pb-2 font-semibold text-right whitespace-nowrap">Acties</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMatches.map((m) => (
                        <tr key={m.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                          <td className="py-2 text-slate-400 text-xs whitespace-nowrap">{new Date(m.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</td>
                          <td className="py-2 text-slate-400 whitespace-nowrap">{TEAM_LABEL[m.clubTeam] ?? m.clubTeam}</td>
                          <td className="py-2 font-medium text-white">{m.name}</td>
                          <td className="py-2 text-slate-500 text-xs whitespace-nowrap">{m.homeAway === "HOME" ? "Thuis" : m.homeAway === "AWAY" ? "Uit" : "Neutraal"}</td>
                          <td className="py-2 text-slate-400 whitespace-nowrap">{m.goalsScored}–{m.goalsConceded}<span className="text-xs text-slate-600 ml-1.5">({m.performances.filter(p => p.played).length})</span></td>
                          <td className="py-2 whitespace-nowrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex justify-end gap-1 flex-wrap">
                              <button onClick={() => openEditMatch(m)} className={BTN_SMALL}>Bewerken</button>
                              <button onClick={() => setViewingMatchPerfs(m)} className={BTN_SMALL}>Prestaties</button>
                              {m.status === "PENDING" && (
                                <>
                                  <button onClick={() => approveMatch(m.id, "APPROVED")} disabled={approvingId === m.id} className="px-2 py-1 text-xs bg-green-900/40 text-green-400 rounded hover:bg-green-900/60 font-medium border border-green-500/30 disabled:opacity-50 transition-colors">OK</button>
                                  <button onClick={() => approveMatch(m.id, "REJECTED")} disabled={approvingId === m.id} className={BTN_DANGER + " disabled:opacity-50"}>Afk.</button>
                                </>
                              )}
                              {m.status === "APPROVED" && (
                                <button onClick={() => approveMatch(m.id, "REJECTED")} disabled={approvingId === m.id} className={BTN_DANGER + " disabled:opacity-50"}>Afk.</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-4 flex-wrap">
              <button onClick={processPoints} disabled={processing} className={BTN_PRIMARY}>
                {processing ? "Verwerken..." : "Verwerk goedgekeurde wedstrijden"}
              </button>
              {pointsMsg && (
                <p className={`text-sm ${pointsMsg.type === "ok" ? "text-green-400" : "text-red-400"}`}>{pointsMsg.text}</p>
              )}
            </div>
          </section>
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
                      {pointsConfig.map((cfg) => (
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
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setRoleModal(null)} className={BTN_SECONDARY}>Annuleer</button>
              <button onClick={saveRole} disabled={roleSaving} className={BTN_PRIMARY}>{roleSaving ? "Opslaan..." : "Opslaan"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: wedstrijd bewerken */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-1">Wedstrijd bewerken</h3>
            <p className="text-sm text-slate-500 mb-4">{TEAM_LABEL[editingMatch.clubTeam] ?? editingMatch.clubTeam}</p>
            <div className="space-y-4">
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
                  <select value={editMatchForm.homeAway} onChange={(e) => setEditMatchForm({ ...editMatchForm, homeAway: e.target.value })} className={SELECT}>
                    <option value="HOME">Thuis</option>
                    <option value="AWAY">Uit</option>
                    <option value="NEUTRAL">Neutraal</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Goals voor</label>
                  <input type="number" value={editMatchForm.goalsScored} onChange={(e) => setEditMatchForm({ ...editMatchForm, goalsScored: Number(e.target.value) })} className={INPUT} min="0" />
                </div>
                <div>
                  <label className={LABEL}>Goals tegen</label>
                  <input type="number" value={editMatchForm.goalsConceded} onChange={(e) => setEditMatchForm({ ...editMatchForm, goalsConceded: Number(e.target.value) })} className={INPUT} min="0" />
                </div>
              </div>
              {editMatchError && <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">{editMatchError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingMatch(null)} className={BTN_SECONDARY}>Annuleer</button>
              <button onClick={saveEditMatch} disabled={editMatchSaving} className={BTN_PRIMARY}>{editMatchSaving ? "Opslaan..." : "Opslaan"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: wedstrijdprestaties bekijken */}
      {viewingMatchPerfs && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{viewingMatchPerfs.name}</h3>
                <p className="text-sm text-slate-500">
                  {TEAM_LABEL[viewingMatchPerfs.clubTeam] ?? viewingMatchPerfs.clubTeam} ·{" "}
                  {viewingMatchPerfs.homeAway === "HOME" ? "Thuis" : viewingMatchPerfs.homeAway === "AWAY" ? "Uit" : "Neutraal"} ·{" "}
                  {viewingMatchPerfs.goalsScored}–{viewingMatchPerfs.goalsConceded}
                </p>
              </div>
              <button onClick={() => setViewingMatchPerfs(null)} className="text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors">×</button>
            </div>
            {viewingMatchPerfs.performances.length === 0 ? (
              <p className="text-slate-500 text-sm">Nog geen prestaties ingevoerd.</p>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-800">
                    <th className="pb-2 font-semibold">Speler</th>
                    <th className="pb-2 font-semibold text-center">Speelde</th>
                    <th className="pb-2 font-semibold text-center">Goals</th>
                    <th className="pb-2 font-semibold text-center">Pen.</th>
                    <th className="pb-2 font-semibold text-center">Assists</th>
                    <th className="pb-2 font-semibold text-center">E.G.</th>
                    <th className="pb-2 font-semibold text-center">Geel</th>
                    <th className="pb-2 font-semibold text-center">Rood</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingMatchPerfs.performances.map((p) => (
                    <tr key={p.playerId} className={`border-b border-slate-800/60 ${!p.played ? "opacity-30" : ""}`}>
                      <td className="py-1.5 font-medium text-white">
                        {p.player.name}
                        <span className="text-slate-500 text-xs ml-1">{POSITION_LABEL[p.player.position] ?? p.player.position}</span>
                      </td>
                      <td className="py-1.5 text-center text-cyan-400">{p.played ? "✓" : "–"}</td>
                      <td className="py-1.5 text-center text-slate-300">{p.goals}</td>
                      <td className="py-1.5 text-center text-slate-300">{p.penaltyGoals}</td>
                      <td className="py-1.5 text-center text-slate-300">{p.assists}</td>
                      <td className="py-1.5 text-center text-slate-300">{p.ownGoals}</td>
                      <td className="py-1.5 text-center">{p.yellowCards > 0 ? "🟡" : <span className="text-slate-600">–</span>}</td>
                      <td className="py-1.5 text-center">{p.redCard ? "🔴" : <span className="text-slate-600">–</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={() => setViewingMatchPerfs(null)} className={BTN_SECONDARY}>Sluiten</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
