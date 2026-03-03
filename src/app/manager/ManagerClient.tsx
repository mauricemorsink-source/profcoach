"use client";

import { useState, useEffect, useRef } from "react";

const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

const CLUB_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

const POSITION_LABEL: Record<string, string> = {
  GK: "Keeper", DEF: "Verdediger", MID: "Middenvelder", ATT: "Aanvaller",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Ingediend", APPROVED: "Goedgekeurd", REJECTED: "Afgekeurd", PROCESSED: "Verwerkt",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-900/40 text-amber-400 border border-amber-500/30",
  APPROVED: "bg-green-900/40 text-green-400 border border-green-500/30",
  REJECTED: "bg-red-900/40 text-red-400 border border-red-500/30",
  PROCESSED: "bg-cyan-900/40 text-cyan-400 border border-cyan-500/30",
};

type Match = {
  id: string;
  name: string;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  matchDate: string;
  goalsScored: number;
  goalsConceded: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  _count: { performances: number };
};

type PlayerPerf = {
  playerId: string;
  playerName: string;
  position: string;
  clubTeam?: string;
  isGuest?: boolean;
  played: boolean;
  goals: number;
  penaltyGoals: number;
  assists: number;
  ownGoals: number;
  yellowCards: number;
  redCard: boolean;
};

type MatchDetail = {
  match: Match;
  players: { id: string; name: string; position: string }[];
  performances: PlayerPerf[];
};

type AllPlayer = { id: string; name: string; position: string; clubTeam: string };

type Props = { managedTeam: string; managerName: string; isAdmin?: boolean };

// Sub-component: guest player picker
function GuestPicker({
  allPlayers,
  managedTeam,
  search,
  onSearchChange,
  onAdd,
  onClose,
  existingIds,
}: {
  allPlayers: AllPlayer[];
  managedTeam: string;
  search: string;
  onSearchChange: (v: string) => void;
  onAdd: (player: AllPlayer) => void;
  onClose: () => void;
  existingIds: Set<string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const candidates = allPlayers.filter(
    (p) =>
      p.clubTeam !== managedTeam &&
      !existingIds.has(p.id) &&
      (search.length < 2 ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (CLUB_LABEL[p.clubTeam] ?? p.clubTeam).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="mt-3 bg-slate-800 border border-amber-500/30 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-amber-400">Gastspeler toevoegen</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-sm transition-colors">✕</button>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Zoek op naam of elftal..."
        className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 mb-2"
      />
      {search.length < 2 ? (
        <p className="text-slate-500 text-xs text-center py-2">Typ minimaal 2 tekens om te zoeken</p>
      ) : candidates.length === 0 ? (
        <p className="text-slate-500 text-xs text-center py-2">Geen spelers gevonden</p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {candidates.map((p) => (
            <button
              key={p.id}
              onClick={() => { onAdd(p); onSearchChange(""); }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left hover:bg-slate-700 transition-colors group"
            >
              <span className="text-sm text-white">{p.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{CLUB_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                <span className="text-xs text-slate-500">{POSITION_LABEL[p.position]?.slice(0, 3)}</span>
                <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">+ toevoegen</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-component: single performance row
function PerfRow({
  p,
  locked,
  onChange,
  onRemove,
  numInputClass,
}: {
  p: PlayerPerf;
  locked: boolean;
  onChange: (field: keyof PlayerPerf, value: unknown) => void;
  onRemove?: () => void;
  numInputClass: string;
}) {
  return (
    <tr className={`border-b border-slate-800 transition-colors ${p.played ? "bg-slate-800/20" : "opacity-40"}`}>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{p.playerName}</span>
          {p.isGuest && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-900/30 border border-amber-500/30 px-1.5 py-0.5 rounded">
              GAST
            </span>
          )}
          {p.isGuest && p.clubTeam && (
            <span className="text-xs text-slate-500">{CLUB_LABEL[p.clubTeam] ?? p.clubTeam}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 text-slate-500 text-xs">{POSITION_LABEL[p.position] ?? p.position}</td>
      <td className="px-3 py-2.5 text-center">
        <input
          type="checkbox"
          checked={p.played}
          onChange={(e) => onChange("played", e.target.checked)}
          disabled={locked}
          className="accent-cyan-500 w-4 h-4 cursor-pointer"
        />
      </td>
      <td className="px-3 py-2.5"><input type="number" min="0" value={p.goals} onChange={(e) => onChange("goals", Number(e.target.value))} disabled={!p.played || locked} className={numInputClass} /></td>
      <td className="px-3 py-2.5"><input type="number" min="0" value={p.penaltyGoals} onChange={(e) => onChange("penaltyGoals", Number(e.target.value))} disabled={!p.played || locked} className={numInputClass} /></td>
      <td className="px-3 py-2.5"><input type="number" min="0" value={p.assists} onChange={(e) => onChange("assists", Number(e.target.value))} disabled={!p.played || locked} className={numInputClass} /></td>
      <td className="px-3 py-2.5"><input type="number" min="0" value={p.ownGoals} onChange={(e) => onChange("ownGoals", Number(e.target.value))} disabled={!p.played || locked} className={numInputClass} /></td>
      <td className="px-3 py-2.5 text-center"><input type="checkbox" checked={p.yellowCards > 0} onChange={(e) => onChange("yellowCards", e.target.checked ? 1 : 0)} disabled={!p.played || locked} className="accent-amber-400 w-4 h-4 cursor-pointer" /></td>
      <td className="px-3 py-2.5 text-center"><input type="checkbox" checked={p.redCard} onChange={(e) => onChange("redCard", e.target.checked)} disabled={!p.played || locked} className="accent-red-400 w-4 h-4 cursor-pointer" /></td>
      <td className="px-3 py-2.5 text-center">
        {p.isGuest && onRemove && !locked && (
          <button onClick={onRemove} className="text-slate-600 hover:text-red-400 transition-colors text-sm" title="Gastspeler verwijderen">✕</button>
        )}
      </td>
    </tr>
  );
}

export default function ManagerClient({ managedTeam, managerName, isAdmin }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "performances">("list");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchDetail, setMatchDetail] = useState<MatchDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [perfs, setPerfs] = useState<PlayerPerf[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Multi-step add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [addForm, setAddForm] = useState({
    name: "", homeAway: "HOME", matchDate: "", goalsScored: "", goalsConceded: "",
  });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addPerfs, setAddPerfs] = useState<PlayerPerf[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Guest player state
  const [allPlayers, setAllPlayers] = useState<AllPlayer[]>([]);
  const [showGuestPickerAdd, setShowGuestPickerAdd] = useState(false);
  const [guestSearchAdd, setGuestSearchAdd] = useState("");
  const [showGuestPickerPerf, setShowGuestPickerPerf] = useState(false);
  const [guestSearchPerf, setGuestSearchPerf] = useState("");

  const adminSuffix = isAdmin ? `?adminTeam=${managedTeam}` : "";

  async function loadMatches() {
    setLoading(true);
    const res = await fetch(`/api/manager/matches${adminSuffix}`);
    if (res.ok) setMatches(await res.json());
    setLoading(false);
  }

  async function loadTeamPlayers() {
    setLoadingPlayers(true);
    const res = await fetch(`/api/manager/players${adminSuffix}`);
    if (res.ok) {
      const players: AllPlayer[] = await res.json();
      setAddPerfs(players.map((p) => ({
        playerId: p.id,
        playerName: p.name,
        position: p.position,
        clubTeam: p.clubTeam,
        isGuest: false,
        played: false,
        goals: 0,
        penaltyGoals: 0,
        assists: 0,
        ownGoals: 0,
        yellowCards: 0,
        redCard: false,
      })));
    }
    setLoadingPlayers(false);
  }

  async function loadAllPlayers() {
    if (allPlayers.length > 0) return;
    const suffix = isAdmin ? `?all=true&adminTeam=${managedTeam}` : "?all=true";
    const res = await fetch(`/api/manager/players${suffix}`);
    if (res.ok) setAllPlayers(await res.json());
  }

  useEffect(() => { loadMatches(); }, []);

  function openAddModal() {
    setAddForm({ name: "", homeAway: "HOME", matchDate: "", goalsScored: "", goalsConceded: "" });
    setAddError("");
    setModalStep(1);
    setShowAddModal(true);
    setShowGuestPickerAdd(false);
    setGuestSearchAdd("");
    loadTeamPlayers();
  }

  function closeAddModal() {
    setShowAddModal(false);
    setModalStep(1);
    setAddError("");
    setShowGuestPickerAdd(false);
    setGuestSearchAdd("");
  }

  function updateAddPerf(playerId: string, field: keyof PlayerPerf, value: unknown) {
    setAddPerfs((prev) => prev.map((p) => p.playerId === playerId ? { ...p, [field]: value } : p));
  }

  function addGuestToAdd(player: AllPlayer) {
    setAddPerfs((prev) => [
      ...prev,
      {
        playerId: player.id,
        playerName: player.name,
        position: player.position,
        clubTeam: player.clubTeam,
        isGuest: true,
        played: true,
        goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false,
      },
    ]);
    setShowGuestPickerAdd(false);
  }

  function addGuestToPerf(player: AllPlayer) {
    setPerfs((prev) => [
      ...prev,
      {
        playerId: player.id,
        playerName: player.name,
        position: player.position,
        clubTeam: player.clubTeam,
        isGuest: true,
        played: true,
        goals: 0, penaltyGoals: 0, assists: 0, ownGoals: 0, yellowCards: 0, redCard: false,
      },
    ]);
    setShowGuestPickerPerf(false);
  }

  function removeGuest(playerId: string, fromAdd: boolean) {
    if (fromAdd) {
      setAddPerfs((prev) => prev.filter((p) => p.playerId !== playerId));
    } else {
      setPerfs((prev) => prev.filter((p) => p.playerId !== playerId));
    }
  }

  async function submitMatch() {
    setAddLoading(true);
    setAddError("");

    const res = await fetch(`/api/manager/matches${adminSuffix}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: addForm.name.trim(),
        homeAway: addForm.homeAway,
        matchDate: addForm.matchDate ? new Date(addForm.matchDate).toISOString() : null,
        goalsScored: Number(addForm.goalsScored) || 0,
        goalsConceded: Number(addForm.goalsConceded) || 0,
      }),
    });
    const matchData = await res.json();
    if (!res.ok) { setAddError(matchData.error || "Fout bij aanmaken wedstrijd"); setAddLoading(false); return; }

    const matchId = matchData.id;
    const played = addPerfs.filter((p) => p.played);
    if (played.length > 0) {
      const perfRes = await fetch(
        `/api/manager/matches/${matchId}/performances${adminSuffix}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ performances: addPerfs }),
        }
      );
      if (!perfRes.ok) {
        setAddError("Wedstrijd aangemaakt, maar prestaties konden niet worden opgeslagen.");
        setAddLoading(false);
        await loadMatches();
        closeAddModal();
        return;
      }
    }

    setAddLoading(false);
    closeAddModal();
    await loadMatches();
  }

  async function openPerformances(matchId: string) {
    setSelectedMatchId(matchId);
    setLoadingDetail(true);
    setView("performances");
    setSaveMsg(null);
    setShowGuestPickerPerf(false);
    setGuestSearchPerf("");
    const res = await fetch(`/api/manager/matches/${matchId}${adminSuffix}`);
    if (res.ok) {
      const data: MatchDetail = await res.json();
      setMatchDetail(data);
      setPerfs(data.performances);
    }
    setLoadingDetail(false);
  }

  async function savePerformances() {
    if (!selectedMatchId) return;
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch(`/api/manager/matches/${selectedMatchId}/performances${adminSuffix}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ performances: perfs }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg("Prestaties opgeslagen");
    } else {
      const data = await res.json();
      setSaveMsg(data.error || "Er is een fout opgetreden");
    }
  }

  function updatePerf(playerId: string, field: keyof PlayerPerf, value: unknown) {
    setPerfs((prev) => prev.map((p) => p.playerId === playerId ? { ...p, [field]: value } : p));
  }

  const INPUT = "w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50";
  const LABEL = "block text-xs font-medium text-slate-400 mb-1";
  const NUM_INPUT = "w-14 bg-slate-800 border border-slate-600 text-white rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed";

  const perfTableHeader = (
    <tr className="text-left text-slate-500 border-b border-slate-700/50 bg-slate-800/50">
      <th className="px-4 py-3 font-medium">Speler</th>
      <th className="px-3 py-3 font-medium">Pos.</th>
      <th className="px-3 py-3 font-medium text-center">Speelde mee</th>
      <th className="px-3 py-3 font-medium text-center">Goals</th>
      <th className="px-3 py-3 font-medium text-center">Pen.</th>
      <th className="px-3 py-3 font-medium text-center">Ass.</th>
      <th className="px-3 py-3 font-medium text-center">E.G.</th>
      <th className="px-3 py-3 font-medium text-center">Geel</th>
      <th className="px-3 py-3 font-medium text-center">Rood</th>
      <th className="px-3 py-3 font-medium text-center w-8"></th>
    </tr>
  );

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#060b14]">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-cyan-500/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Wedstrijdbeheer</h1>
          <p className="text-sm text-slate-400">{TEAM_LABEL[managedTeam] ?? managedTeam} · {managerName}</p>
        </div>
        {view === "performances" && (
          <button
            onClick={() => { setView("list"); setSelectedMatchId(null); setMatchDetail(null); }}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ← Terug naar overzicht
          </button>
        )}
      </div>

      <main className="max-w-5xl mx-auto p-6">

        {/* Wedstrijdlijst */}
        {view === "list" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-300">
                Wedstrijden {TEAM_LABEL[managedTeam] ?? managedTeam}
              </h2>
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-colors neon-glow-sm"
              >
                + Wedstrijd toevoegen
              </button>
            </div>

            {loading ? (
              <p className="text-slate-500 text-sm">Laden...</p>
            ) : matches.length === 0 ? (
              <div className="bg-slate-900 neon-border rounded-xl p-10 text-center">
                <p className="text-slate-500 text-sm">Nog geen wedstrijden ingevoerd.</p>
              </div>
            ) : (
              <div className="bg-slate-900 neon-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-700/50 bg-slate-800/50">
                      <th className="px-4 py-3 font-medium">Datum</th>
                      <th className="px-4 py-3 font-medium">Tegenstander</th>
                      <th className="px-4 py-3 font-medium">T/U</th>
                      <th className="px-4 py-3 font-medium">Score</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m) => (
                      <tr key={m.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(m.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">{m.name}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {m.homeAway === "HOME" ? "Thuis" : m.homeAway === "AWAY" ? "Uit" : "Neutraal"}
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono">
                          {m.homeAway === "AWAY" ? m.goalsConceded : m.goalsScored}
                          {" – "}
                          {m.homeAway === "AWAY" ? m.goalsScored : m.goalsConceded}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status]}`}>
                            {STATUS_LABEL[m.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openPerformances(m.id)}
                            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                              m.status === "PENDING"
                                ? "bg-cyan-900/50 text-cyan-400 hover:bg-cyan-800/50 border border-cyan-500/30"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-600"
                            }`}
                          >
                            {m.status === "PENDING" ? "Prestaties invullen" : "Bekijken"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Prestaties invullen */}
        {view === "performances" && (
          <div>
            {loadingDetail ? (
              <p className="text-slate-500 text-sm">Laden...</p>
            ) : matchDetail ? (
              <div>
                <div className="bg-slate-900 neon-border rounded-xl p-4 mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-white">{matchDetail.match.name}</h2>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {new Date(matchDetail.match.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                      {" · "}
                      <span className="font-mono text-white">
                        {matchDetail.match.homeAway === "AWAY"
                          ? `${matchDetail.match.name} ${matchDetail.match.goalsConceded} – ${matchDetail.match.goalsScored} ${TEAM_LABEL[managedTeam] ?? managedTeam}`
                          : `${TEAM_LABEL[managedTeam] ?? managedTeam} ${matchDetail.match.goalsScored} – ${matchDetail.match.goalsConceded} ${matchDetail.match.name}`}
                      </span>
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[matchDetail.match.status]}`}>
                    {STATUS_LABEL[matchDetail.match.status]}
                  </span>
                </div>

                <div className="bg-slate-900 neon-border rounded-xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>{perfTableHeader}</thead>
                    <tbody>
                      {perfs.map((p) => (
                        <PerfRow
                          key={p.playerId}
                          p={p}
                          locked={matchDetail.match.status !== "PENDING"}
                          onChange={(field, value) => updatePerf(p.playerId, field, value)}
                          onRemove={p.isGuest ? () => removeGuest(p.playerId, false) : undefined}
                          numInputClass={NUM_INPUT}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {matchDetail.match.status === "PENDING" && (
                  <div className="mt-3">
                    {showGuestPickerPerf ? (
                      <GuestPicker
                        allPlayers={allPlayers}
                        managedTeam={managedTeam}
                        search={guestSearchPerf}
                        onSearchChange={setGuestSearchPerf}
                        onAdd={addGuestToPerf}
                        onClose={() => { setShowGuestPickerPerf(false); setGuestSearchPerf(""); }}
                        existingIds={new Set(perfs.map((p) => p.playerId))}
                      />
                    ) : (
                      <button
                        onClick={() => { setShowGuestPickerPerf(true); loadAllPlayers(); }}
                        className="mt-2 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-500/30 rounded-lg transition-colors"
                      >
                        + Gastspeler toevoegen
                      </button>
                    )}
                  </div>
                )}

                {matchDetail.match.status === "PENDING" && (
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      onClick={savePerformances}
                      disabled={saving}
                      className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors neon-glow-sm"
                    >
                      {saving ? "Opslaan..." : "Prestaties opslaan"}
                    </button>
                    {saveMsg && (
                      <p className={`text-sm ${saveMsg === "Prestaties opgeslagen" ? "text-green-400" : "text-red-400"}`}>
                        {saveMsg}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-400 text-sm">Wedstrijd niet gevonden.</p>
            )}
          </div>
        )}
      </main>

      {/* Multi-step modal: wedstrijd toevoegen */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-700/50">
              <div>
                <h3 className="text-lg font-bold text-white">Wedstrijd toevoegen</h3>
                <div className="flex gap-2 mt-2">
                  {[{ n: 1, label: "Details" }, { n: 2, label: "Spelers" }, { n: 3, label: "Overzicht" }].map(({ n, label }) => (
                    <div key={n} className={`flex items-center gap-1.5 text-xs ${modalStep >= n ? "text-cyan-400" : "text-slate-600"}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border ${modalStep > n ? "bg-cyan-500 border-cyan-500 text-white" : modalStep === n ? "border-cyan-500 text-cyan-400" : "border-slate-600 text-slate-600"}`}>
                        {modalStep > n ? "✓" : n}
                      </span>
                      {label}
                      {n < 3 && <span className="text-slate-700 ml-1">›</span>}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={closeAddModal} className="text-slate-500 hover:text-white transition-colors text-lg">✕</button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* Step 1: Match details */}
              {modalStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className={LABEL}>Tegenstander</label>
                    <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className={INPUT} placeholder="Naam tegenstander" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Thuis / Uit</label>
                      <select value={addForm.homeAway} onChange={(e) => setAddForm({ ...addForm, homeAway: e.target.value })} className={INPUT}>
                        <option value="HOME">Thuis</option>
                        <option value="AWAY">Uit</option>
                        <option value="NEUTRAL">Neutraal</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Datum & tijd</label>
                      <input type="date" value={addForm.matchDate} onChange={(e) => setAddForm({ ...addForm, matchDate: e.target.value })} className={INPUT} />
                    </div>
                  </div>
                  {/* Score — visual home/away display */}
                  <div>
                    <label className={LABEL}>Stand</label>
                    <div className="flex items-center gap-3">
                      {/* Left side (home team) */}
                      <div className="flex-1 min-w-0 text-center">
                        <p className="text-xs text-slate-500 truncate mb-1">
                          {addForm.homeAway === "AWAY"
                            ? (addForm.name || "Tegenstander")
                            : (TEAM_LABEL[managedTeam] ?? managedTeam)}
                        </p>
                        <input
                          type="number" min="0"
                          value={addForm.homeAway === "AWAY" ? addForm.goalsConceded : addForm.goalsScored}
                          onChange={(e) => setAddForm(
                            addForm.homeAway === "AWAY"
                              ? { ...addForm, goalsConceded: e.target.value }
                              : { ...addForm, goalsScored: e.target.value }
                          )}
                          className="w-full text-center text-2xl font-bold bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                          placeholder="0"
                        />
                      </div>
                      <span className="text-slate-500 font-bold text-2xl shrink-0">–</span>
                      {/* Right side (away team) */}
                      <div className="flex-1 min-w-0 text-center">
                        <p className="text-xs text-slate-500 truncate mb-1">
                          {addForm.homeAway === "AWAY"
                            ? (TEAM_LABEL[managedTeam] ?? managedTeam)
                            : (addForm.name || "Tegenstander")}
                        </p>
                        <input
                          type="number" min="0"
                          value={addForm.homeAway === "AWAY" ? addForm.goalsScored : addForm.goalsConceded}
                          onChange={(e) => setAddForm(
                            addForm.homeAway === "AWAY"
                              ? { ...addForm, goalsScored: e.target.value }
                              : { ...addForm, goalsConceded: e.target.value }
                          )}
                          className="w-full text-center text-2xl font-bold bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Player performances */}
              {modalStep === 2 && (
                <div>
                  {loadingPlayers ? (
                    <p className="text-slate-500 text-sm text-center py-8">Spelers laden...</p>
                  ) : (
                    <div>
                      <p className="text-slate-400 text-xs mb-4">Vink aan wie heeft meegespeeld en vul hun statistieken in.</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-slate-500 border-b border-slate-700/50 text-xs">
                              <th className="py-2 font-medium">Speler</th>
                              <th className="px-2 py-2 font-medium">Pos.</th>
                              <th className="px-2 py-2 font-medium text-center">Mee</th>
                              <th className="px-2 py-2 font-medium text-center">⚽</th>
                              <th className="px-2 py-2 font-medium text-center">Pen</th>
                              <th className="px-2 py-2 font-medium text-center">Ass</th>
                              <th className="px-2 py-2 font-medium text-center">EG</th>
                              <th className="px-2 py-2 font-medium text-center">🟡</th>
                              <th className="px-2 py-2 font-medium text-center">🔴</th>
                              <th className="px-2 py-2 w-6"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {addPerfs.map((p) => (
                              <tr key={p.playerId} className={`border-b border-slate-800 ${p.played ? "" : "opacity-40"}`}>
                                <td className="py-2 font-medium text-white text-xs">
                                  <div className="flex items-center gap-1.5">
                                    {p.playerName}
                                    {p.isGuest && (
                                      <span className="text-[9px] font-bold text-amber-400 bg-amber-900/30 border border-amber-500/30 px-1 py-0.5 rounded">GAST</span>
                                    )}
                                  </div>
                                  {p.isGuest && p.clubTeam && (
                                    <div className="text-[10px] text-slate-500">{CLUB_LABEL[p.clubTeam] ?? p.clubTeam}</div>
                                  )}
                                </td>
                                <td className="px-2 py-2 text-slate-500 text-xs">{POSITION_LABEL[p.position]?.slice(0, 3)}</td>
                                <td className="px-2 py-2 text-center">
                                  <input type="checkbox" checked={p.played} onChange={(e) => updateAddPerf(p.playerId, "played", e.target.checked)} className="accent-cyan-500 w-4 h-4 cursor-pointer" />
                                </td>
                                <td className="px-2 py-2"><input type="number" min="0" value={p.goals} onChange={(e) => updateAddPerf(p.playerId, "goals", Number(e.target.value))} disabled={!p.played} className={NUM_INPUT} /></td>
                                <td className="px-2 py-2"><input type="number" min="0" value={p.penaltyGoals} onChange={(e) => updateAddPerf(p.playerId, "penaltyGoals", Number(e.target.value))} disabled={!p.played} className={NUM_INPUT} /></td>
                                <td className="px-2 py-2"><input type="number" min="0" value={p.assists} onChange={(e) => updateAddPerf(p.playerId, "assists", Number(e.target.value))} disabled={!p.played} className={NUM_INPUT} /></td>
                                <td className="px-2 py-2"><input type="number" min="0" value={p.ownGoals} onChange={(e) => updateAddPerf(p.playerId, "ownGoals", Number(e.target.value))} disabled={!p.played} className={NUM_INPUT} /></td>
                                <td className="px-2 py-2 text-center"><input type="checkbox" checked={p.yellowCards > 0} onChange={(e) => updateAddPerf(p.playerId, "yellowCards", e.target.checked ? 1 : 0)} disabled={!p.played} className="accent-amber-400 w-4 h-4 cursor-pointer" /></td>
                                <td className="px-2 py-2 text-center"><input type="checkbox" checked={p.redCard} onChange={(e) => updateAddPerf(p.playerId, "redCard", e.target.checked)} disabled={!p.played} className="accent-red-400 w-4 h-4 cursor-pointer" /></td>
                                <td className="px-2 py-2 text-center">
                                  {p.isGuest && (
                                    <button onClick={() => removeGuest(p.playerId, true)} className="text-slate-600 hover:text-red-400 transition-colors text-sm">✕</button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {showGuestPickerAdd ? (
                        <GuestPicker
                          allPlayers={allPlayers}
                          managedTeam={managedTeam}
                          search={guestSearchAdd}
                          onSearchChange={setGuestSearchAdd}
                          onAdd={addGuestToAdd}
                          onClose={() => { setShowGuestPickerAdd(false); setGuestSearchAdd(""); }}
                          existingIds={new Set(addPerfs.map((p) => p.playerId))}
                        />
                      ) : (
                        <button
                          onClick={() => { setShowGuestPickerAdd(true); loadAllPlayers(); }}
                          className="mt-4 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-500/30 rounded-lg transition-colors"
                        >
                          + Gastspeler toevoegen
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Overview */}
              {modalStep === 3 && (
                <div>
                  <div className="bg-slate-800/50 rounded-xl p-4 mb-5 border border-slate-700/50">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500 text-xs">Tegenstander</span>
                        <p className="text-white font-semibold">{addForm.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">Datum</span>
                        <p className="text-white">{addForm.matchDate ? new Date(addForm.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : "–"}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">Thuis / Uit</span>
                        <p className="text-white">{addForm.homeAway === "HOME" ? "Thuis" : addForm.homeAway === "AWAY" ? "Uit" : "Neutraal"}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">Stand</span>
                        <p className="text-white font-mono text-sm">
                          {addForm.homeAway === "AWAY"
                            ? `${addForm.name || "Tegenstander"} ${addForm.goalsConceded || 0} – ${addForm.goalsScored || 0} ${TEAM_LABEL[managedTeam] ?? managedTeam}`
                            : `${TEAM_LABEL[managedTeam] ?? managedTeam} ${addForm.goalsScored || 0} – ${addForm.goalsConceded || 0} ${addForm.name || "Tegenstander"}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Speelden mee ({addPerfs.filter(p => p.played).length})</h4>
                  {addPerfs.filter(p => p.played).length === 0 ? (
                    <p className="text-slate-500 text-sm">Geen spelers geselecteerd.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {addPerfs.filter(p => p.played).map((p) => (
                        <div key={p.playerId} className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-3 py-2">
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <span className="text-white text-sm font-medium truncate">{p.playerName}</span>
                            {p.isGuest && (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-900/30 border border-amber-500/30 px-1 py-0.5 rounded shrink-0">GAST</span>
                            )}
                            <span className="text-slate-500 text-xs shrink-0">{POSITION_LABEL[p.position]}</span>
                          </div>
                          <div className="flex gap-2 text-xs text-slate-400 shrink-0">
                            {p.goals > 0 && <span className="text-white">⚽ {p.goals}</span>}
                            {p.penaltyGoals > 0 && <span className="text-slate-300">Pen {p.penaltyGoals}</span>}
                            {p.assists > 0 && <span className="text-cyan-400">Ass {p.assists}</span>}
                            {p.ownGoals > 0 && <span className="text-red-400">EG {p.ownGoals}</span>}
                            {p.yellowCards > 0 && <span className="text-amber-400">🟡</span>}
                            {p.redCard && <span className="text-red-500">🔴</span>}
                            {p.goals === 0 && p.assists === 0 && p.ownGoals === 0 && !p.yellowCards && !p.redCard && (
                              <span className="text-slate-600">–</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {addError && <p className="mt-4 text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">{addError}</p>}
                </div>
              )}

              {addError && modalStep < 3 && (
                <p className="mt-4 text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">{addError}</p>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-700/50">
              <button
                onClick={() => modalStep === 1 ? closeAddModal() : setModalStep((s) => (s - 1) as 1 | 2 | 3)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {modalStep === 1 ? "Annuleer" : "← Terug"}
              </button>

              {modalStep < 3 ? (
                <button
                  onClick={() => {
                    if (modalStep === 1 && !addForm.name.trim()) { setAddError("Naam tegenstander is verplicht."); return; }
                    if (modalStep === 1 && !addForm.matchDate) { setAddError("Datum is verplicht."); return; }
                    setAddError("");
                    setModalStep((s) => (s + 1) as 2 | 3);
                  }}
                  className="px-5 py-2 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors neon-glow-sm"
                >
                  Volgende →
                </button>
              ) : (
                <button
                  onClick={submitMatch}
                  disabled={addLoading}
                  className="px-5 py-2 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 transition-colors neon-glow-sm"
                >
                  {addLoading ? "Opslaan..." : "Wedstrijd opslaan"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
