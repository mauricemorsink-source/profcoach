"use client";

import { useState, useEffect, useRef } from "react";
import type { Match, PlayerPerf, MatchDetail, AllPlayer } from "@/components/manager/types";
import { TEAM_LABEL } from "@/components/manager/constants";
import MatchList from "@/components/manager/MatchList";
import PerformancesView from "@/components/manager/PerformancesView";
import AddMatchModal from "@/components/manager/AddMatchModal";

type Props = { managedTeam: string; managerName: string; isAdmin?: boolean; shareToken?: string };

export default function ManagerClient({ managedTeam, managerName, isAdmin, shareToken }: Props) {
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
    submittedByName: "", name: "", homeAway: "HOME", matchDate: "", goalsScored: "", goalsConceded: "",
    notes: "",
  });
  const [extraScorers, setExtraScorers] = useState<{ goals: string; description: string }[]>([]);
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
  // Verwijzen naar het scrollende tabelvak, zodat een net toegevoegde gastspeler (die
  // onderaan de lijst komt) meteen in beeld gescrold kan worden i.p.v. buiten het
  // begrensde scrollvak te blijven staan.
  const addPerfsBoxRef = useRef<HTMLDivElement>(null);
  const perfsBoxRef = useRef<HTMLDivElement>(null);

  const authSuffix = isAdmin
    ? `?adminTeam=${managedTeam}`
    : shareToken
    ? `?shareToken=${shareToken}&team=${managedTeam}`
    : "";

  async function loadMatches() {
    setLoading(true);
    const res = await fetch(`/api/manager/matches${authSuffix}`);
    if (res.ok) setMatches(await res.json());
    setLoading(false);
  }

  async function loadTeamPlayers() {
    setLoadingPlayers(true);
    const res = await fetch(`/api/manager/players${authSuffix}`);
    if (res.ok) {
      const players: AllPlayer[] = await res.json();
      setAddPerfs(players.map((p) => ({
        playerId: p.id,
        playerName: p.name,
        position: p.position,
        clubTeam: p.clubTeam,
        altTeam: p.altTeam ?? null,
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
    const suffix = authSuffix ? `${authSuffix}&all=true` : "?all=true";
    const res = await fetch(`/api/manager/players${suffix}`);
    if (res.ok) setAllPlayers(await res.json());
  }

  useEffect(() => { loadMatches(); }, []);

  function openAddModal() {
    setAddForm({ submittedByName: "", name: "", homeAway: "HOME", matchDate: "", goalsScored: "", goalsConceded: "", notes: "" });
    setExtraScorers([]);
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

  // Scrolt het begrensde tabelvak naar beneden zodat een net toegevoegde gastspeler
  // (onderaan de lijst) meteen zichtbaar is, zonder handmatig te hoeven scrollen.
  function scrollBoxToBottom(ref: React.RefObject<HTMLDivElement | null>) {
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
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
    scrollBoxToBottom(addPerfsBoxRef);
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
    scrollBoxToBottom(perfsBoxRef);
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

    const res = await fetch(`/api/manager/matches${authSuffix}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submittedByName: addForm.submittedByName.trim(),
        name: addForm.name.trim(),
        homeAway: addForm.homeAway,
        matchDate: addForm.matchDate ? new Date(addForm.matchDate).toISOString() : null,
        goalsScored: Number(addForm.goalsScored) || 0,
        goalsConceded: Number(addForm.goalsConceded) || 0,
        extraScorers: extraScorers.filter(s => s.description.trim()).map(s => ({ goals: Number(s.goals) || 1, description: s.description.trim() })),
        notes: addForm.notes.trim() || null,
      }),
    });
    const matchData = await res.json();
    if (!res.ok) { setAddError(matchData.error || "Fout bij aanmaken wedstrijd"); setAddLoading(false); return; }

    const matchId = matchData.id;
    const played = addPerfs.filter((p) => p.played);
    if (played.length > 0) {
      const perfRes = await fetch(
        `/api/manager/matches/${matchId}/performances${authSuffix}`,
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
    const res = await fetch(`/api/manager/matches/${matchId}${authSuffix}`);
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
    const res = await fetch(`/api/manager/matches/${selectedMatchId}/performances${authSuffix}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ performances: perfs }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg("Prestaties opgeslagen");
      // Status kan zijn teruggezet naar PENDING — refresh zodat UI klopt
      await loadMatches();
      if (selectedMatchId) {
        const refreshed = await fetch(`/api/manager/matches/${selectedMatchId}${authSuffix}`);
        if (refreshed.ok) {
          const data: MatchDetail = await refreshed.json();
          setMatchDetail(data);
        }
      }
    } else {
      const data = await res.json();
      setSaveMsg(data.error || "Er is een fout opgetreden");
    }
  }

  function updatePerf(playerId: string, field: keyof PlayerPerf, value: unknown) {
    setPerfs((prev) => prev.map((p) => p.playerId === playerId ? { ...p, [field]: value } : p));
  }

  const TH = "px-3 py-3 font-medium bg-slate-800";
  const perfTableHeader = (
    <tr className="text-left text-slate-500 border-b border-slate-700/50">
      <th className={`${TH} px-4`}>Speler</th>
      <th className={TH}>Pos.</th>
      <th className={`${TH} text-center`}>Speelde mee</th>
      <th className={`${TH} text-center`}>Goals</th>
      <th className={`${TH} text-center`}>Pen.</th>
      <th className={`${TH} text-center`}>Ass.</th>
      <th className={`${TH} text-center`}>E.G.</th>
      <th className={`${TH} text-center`}>Kaart</th>
      <th className={`${TH} text-center w-8`}></th>
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
          <MatchList
            matches={matches}
            loading={loading}
            managedTeam={managedTeam}
            onOpenPerformances={openPerformances}
            onOpenAddModal={openAddModal}
          />
        )}

        {/* Prestaties invullen */}
        {view === "performances" && (
          <PerformancesView
            loadingDetail={loadingDetail}
            matchDetail={matchDetail}
            managedTeam={managedTeam}
            perfsBoxRef={perfsBoxRef}
            perfTableHeader={perfTableHeader}
            perfs={perfs}
            onUpdatePerf={updatePerf}
            onRemoveGuest={(playerId) => removeGuest(playerId, false)}
            allPlayers={allPlayers}
            showGuestPickerPerf={showGuestPickerPerf}
            guestSearchPerf={guestSearchPerf}
            onGuestSearchChange={setGuestSearchPerf}
            onAddGuest={addGuestToPerf}
            onCloseGuestPicker={() => { setShowGuestPickerPerf(false); setGuestSearchPerf(""); }}
            onShowGuestPicker={() => { setShowGuestPickerPerf(true); loadAllPlayers(); }}
            onSavePerformances={savePerformances}
            saving={saving}
            saveMsg={saveMsg}
          />
        )}
      </main>

      {/* Multi-step modal: wedstrijd toevoegen */}
      {showAddModal && (
        <AddMatchModal
          modalStep={modalStep}
          setModalStep={setModalStep}
          addForm={addForm}
          setAddForm={setAddForm}
          extraScorers={extraScorers}
          setExtraScorers={setExtraScorers}
          addError={addError}
          setAddError={setAddError}
          addLoading={addLoading}
          addPerfs={addPerfs}
          onUpdateAddPerf={updateAddPerf}
          loadingPlayers={loadingPlayers}
          allPlayers={allPlayers}
          showGuestPickerAdd={showGuestPickerAdd}
          guestSearchAdd={guestSearchAdd}
          onGuestSearchChange={setGuestSearchAdd}
          onAddGuest={addGuestToAdd}
          onCloseGuestPicker={() => { setShowGuestPickerAdd(false); setGuestSearchAdd(""); }}
          onShowGuestPicker={() => { setShowGuestPickerAdd(true); loadAllPlayers(); }}
          onRemoveGuest={(playerId) => removeGuest(playerId, true)}
          managedTeam={managedTeam}
          addPerfsBoxRef={addPerfsBoxRef}
          onClose={closeAddModal}
          onSubmit={submitMatch}
        />
      )}
    </div>
  );
}
