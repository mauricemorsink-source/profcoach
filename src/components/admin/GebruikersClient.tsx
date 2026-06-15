"use client";

import { useState, useEffect } from "react";

type TeamPlayer = {
  slotIndex: number;
  player: { name: string; position: string; clubTeam: string };
};

type TeamPrediction = {
  topScorer: { id: string; name: string } | null;
  assistKoning: { id: string; name: string } | null;
  totalYellowCards: number | null;
  totalGoals: number | null;
};

type TeamEntry = {
  id: string;
  locked: boolean;
  bonusPoints: number;
  formation: { code: string } | null;
  players: TeamPlayer[];
  prediction: TeamPrediction | null;
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

const TEAMS = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];

const POSITION_SHORT: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};

const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const LABEL = "block text-sm font-medium text-slate-400 mb-1";
const SELECT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700";
const BTN_SMALL = "px-3 py-1.5 text-xs bg-slate-800 text-slate-400 rounded hover:bg-slate-700 font-medium border border-slate-700 transition-colors";

export default function GebruikersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [roleModal, setRoleModal] = useState<User | null>(null);
  const [roleForm, setRoleForm] = useState<{
    role: string;
    managedTeam: string;
    isParticipant: boolean;
    name: string;
    email: string;
  }>({ role: "USER", managedTeam: "ONE", isParticipant: true, name: "", email: "" });
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [linkGenerating, setLinkGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [bonusInput, setBonusInput] = useState<string>("0");
  const [bonusSaving, setBonusSaving] = useState(false);
  const [bonusMsg, setBonusMsg] = useState<string | null>(null);

  async function loadUsers() {
    setLoadingUsers(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoadingUsers(false);
  }

  async function saveRole() {
    if (!roleModal) return;
    setRoleSaving(true);
    setRoleError("");
    const res = await fetch(`/api/admin/users/${roleModal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: roleForm.role,
        managedTeam: roleForm.role === "MANAGER" ? roleForm.managedTeam : null,
        isParticipant: roleForm.isParticipant,
        name: roleForm.name || null,
        email: roleForm.email,
      }),
    });
    const data = await res.json();
    setRoleSaving(false);
    if (!res.ok) {
      setRoleError(data.error || "Er is een fout opgetreden");
      return;
    }
    setRoleModal(null);
    await loadUsers();
  }

  function openRoleModal(user: User) {
    setRoleForm({
      role: user.role,
      managedTeam: user.managedTeam ?? "ONE",
      isParticipant: user.isParticipant ?? true,
      name: user.name ?? "",
      email: user.email,
    });
    setBonusInput(String(user.teamEntries[0]?.bonusPoints ?? 0));
    setBonusMsg(null);
    setRoleError("");
    setGeneratedLink(null);
    setRoleModal(user);
  }

  async function saveBonus() {
    if (!roleModal || !roleModal.teamEntries[0]) return;
    setBonusSaving(true);
    setBonusMsg(null);
    const res = await fetch(`/api/admin/team-entries/${roleModal.teamEntries[0].id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bonusPoints: Number(bonusInput) || 0 }),
    });
    setBonusSaving(false);
    if (!res.ok) {
      setBonusMsg("Opslaan mislukt");
      return;
    }
    setBonusMsg("Opgeslagen");
    await loadUsers();
  }

  async function generateLoginLink(userId: string) {
    setLinkGenerating(true);
    setGeneratedLink(null);
    const res = await fetch(`/api/admin/users/${userId}/login-link`, { method: "POST" });
    const data = await res.json();
    setLinkGenerating(false);
    if (res.ok) setGeneratedLink(data.link);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // suppress unused warning
  void bonusInput;
  void bonusSaving;
  void bonusMsg;
  void saveBonus;

  return (
    <div className="max-w-4xl">
      <section className="bg-slate-900 neon-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Gebruikers</h2>
          <button onClick={loadUsers} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            Vernieuwen
          </button>
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
                    <td className="py-2 font-medium text-white whitespace-nowrap">
                      {user.name ?? <span className="text-slate-500 italic">Geen naam</span>}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                            user.role === "ADMIN"
                              ? "bg-purple-900/40 text-purple-400 border-purple-500/30"
                              : user.role === "MANAGER"
                              ? "bg-blue-900/40 text-blue-400 border-blue-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {user.role === "ADMIN" ? "Admin" : user.role === "MANAGER" ? "Beheerder" : "Deelnemer"}
                        </span>
                        {user.managedTeam && (
                          <span className="text-xs text-slate-500">
                            {TEAM_LABEL[user.managedTeam] ?? user.managedTeam}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <button onClick={() => openRoleModal(user)} className={BTN_SMALL}>
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-600 mt-2">{users.length} gebruikers</p>
          </div>
        )}
      </section>

      {/* Modal: gebruiker details + bewerken */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{roleModal.name ?? roleModal.email}</h3>
                <p className="text-sm text-slate-500">{roleModal.email}</p>
              </div>
              <button
                onClick={() => setRoleModal(null)}
                className="text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {/* Team info (read-only) */}
            <div className="mb-5 pb-5 border-b border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Fantasy team</p>
              {roleModal.teamEntries.length === 0 ? (
                <p className="text-slate-500 text-sm">Geen team ingevuld.</p>
              ) : (
                (() => {
                  const entry = roleModal.teamEntries[0];
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {entry.formation && (
                          <span className="bg-cyan-900/40 text-cyan-400 px-2 py-0.5 rounded-full text-xs font-semibold border border-cyan-500/30">
                            {entry.formation.code}
                          </span>
                        )}
                        {entry.locked && (
                          <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-xs font-medium border border-slate-700">
                            Ingediend
                          </span>
                        )}
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
                                <td className="py-1 text-slate-500">
                                  {POSITION_SHORT[tp.player.position] ?? tp.player.position}
                                </td>
                                <td className="py-1 text-slate-500">
                                  {TEAM_LABEL[tp.player.clubTeam] ?? tp.player.clubTeam}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Voorspellingen + bonuspunten */}
            {roleModal.teamEntries.length > 0 &&
              (() => {
                const entry = roleModal.teamEntries[0];
                const pred = entry.prediction;
                return (
                  <div className="mb-5 pb-5 border-b border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">
                      Voorspellingen
                    </p>
                    {pred ? (
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Topscorer</span>
                          <span className="text-white font-medium">
                            {pred.topScorer?.name ?? (
                              <span className="text-slate-600 italic">Niet ingevuld</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Assistkoning</span>
                          <span className="text-white font-medium">
                            {pred.assistKoning?.name ?? (
                              <span className="text-slate-600 italic">Niet ingevuld</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Gele kaarten</span>
                          <span className="text-white font-medium">
                            {pred.totalYellowCards ?? (
                              <span className="text-slate-600 italic">Niet ingevuld</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Totaal doelpunten</span>
                          <span className="text-white font-medium">
                            {pred.totalGoals ?? (
                              <span className="text-slate-600 italic">Niet ingevuld</span>
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600 text-sm mb-4 italic">
                        Nog geen voorspellingen ingediend.
                      </p>
                    )}
                    {entry.bonusPoints > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-amber-400 bg-amber-900/20 border border-amber-500/30 px-2 py-1 rounded-full font-semibold">
                          {entry.bonusPoints} bonuspunten toegekend
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Edit form */}
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Instellingen</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Naam</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className={INPUT}
                    placeholder="Voornaam Achternaam"
                  />
                </div>
                <div>
                  <label className={LABEL}>E-mailadres</label>
                  <input
                    type="email"
                    value={roleForm.email}
                    onChange={(e) => setRoleForm({ ...roleForm, email: e.target.value })}
                    className={INPUT}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL}>Rol</label>
                <select
                  value={roleForm.role}
                  onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })}
                  className={SELECT}
                >
                  <option value="USER">Deelnemer</option>
                  <option value="MANAGER">Teambeheerder</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {roleForm.role === "MANAGER" && (
                <div>
                  <label className={LABEL}>Elftal</label>
                  <select
                    value={roleForm.managedTeam}
                    onChange={(e) => setRoleForm({ ...roleForm, managedTeam: e.target.value })}
                    className={SELECT}
                  >
                    {TEAMS.map((t) => (
                      <option key={t} value={t}>
                        {TEAM_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={roleForm.isParticipant}
                    onChange={(e) => setRoleForm({ ...roleForm, isParticipant: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-300">Doet mee aan tussenstand</span>
                  <p className="text-xs text-slate-600">Verschijnt in de tussenstand als deelnemer</p>
                </div>
              </label>
              {roleError && (
                <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/30">
                  {roleError}
                </p>
              )}
            </div>

            {/* Aanmeldlink */}
            <div className="mt-5 pt-5 border-t border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Aanmeldlink</p>
              <p className="text-xs text-slate-500 mb-3">
                Genereer een eenmalige link (24 uur geldig). Stuur via WhatsApp. Gebruiker wordt gedwongen
                een wachtwoord in te stellen.
              </p>
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
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                      }}
                      className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      Kopieer
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Link is 24 uur geldig en kan maar één keer gebruikt worden.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setRoleModal(null)} className={BTN_SECONDARY}>
                Annuleer
              </button>
              <button onClick={saveRole} disabled={roleSaving} className={BTN_PRIMARY}>
                {roleSaving ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
