"use client";

import { useState, useEffect } from "react";

type Account = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "MANAGER";
  managedTeam: string | null;
};

const TEAMS = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];
const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};
const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-colors";
const LABEL = "block text-sm font-medium text-slate-400 mb-1";
const SELECT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-colors";
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700";
const BTN_SMALL = "px-3 py-1.5 text-xs bg-slate-800 text-slate-400 rounded hover:bg-slate-700 font-medium border border-slate-700 transition-colors";
const BTN_DANGER = "px-3 py-1.5 text-xs bg-red-900/40 text-red-400 rounded hover:bg-red-900/60 font-medium border border-red-500/30 transition-colors";

export default function AccountsClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [modal, setModal] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "MANAGER", managedTeam: "ONE" });
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loginLink, setLoginLink] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);

  // Bulk verwijderen
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState("");

  // Nieuw account
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "MANAGER", managedTeam: "ONE" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const all = await res.json();
      setAccounts(all.filter((u: Account) => u.role === "ADMIN" || u.role === "MANAGER"));
    }
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
    const allSelected = accounts.length > 0 && accounts.every((a) => selectedIds.has(a.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      accounts.forEach((a) => (allSelected ? next.delete(a.id) : next.add(a.id)));
      return next;
    });
  }

  async function bulkDelete() {
    setBulkDeleting(true);
    setBulkError("");
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    const data = await res.json();
    setBulkDeleting(false);
    if (!res.ok) { setBulkError(data.error ?? "Verwijderen mislukt"); return; }
    setSelectedIds(new Set());
    setConfirmBulk(false);
    await load();
  }

  async function save() {
    if (!modal) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/users/${modal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        role: form.role,
        managedTeam: form.role === "MANAGER" ? form.managedTeam : null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Opslaan mislukt"); return; }
    setModal(null);
    await load();
  }

  async function createAccount() {
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        managedTeam: createForm.role === "MANAGER" ? createForm.managedTeam : null,
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateError(data.error ?? "Aanmaken mislukt"); return; }
    setShowCreate(false);
    setCreateForm({ name: "", email: "", password: "", role: "MANAGER", managedTeam: "ONE" });
    await load();
  }

  async function generateLink() {
    if (!modal) return;
    setLinkLoading(true);
    setLoginLink(null);
    const res = await fetch(`/api/admin/users/${modal.id}/login-link`, { method: "POST" });
    const data = await res.json();
    setLinkLoading(false);
    if (res.ok) setLoginLink(data.link);
  }

  async function savePassword() {
    if (!modal || !newPassword.trim()) return;
    setPwSaving(true);
    setPwMsg("");
    const res = await fetch(`/api/admin/users/${modal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    setPwSaving(false);
    if (res.ok) { setNewPassword(""); setPwMsg("Wachtwoord gewijzigd"); }
    else { const d = await res.json(); setPwMsg(d.error ?? "Mislukt"); }
  }

  function openModal(a: Account) {
    setForm({ name: a.name ?? "", email: a.email, role: a.role, managedTeam: a.managedTeam ?? "ONE" });
    setError("");
    setNewPassword("");
    setPwMsg("");
    setLoginLink(null);
    setModal(a);
  }

  useEffect(() => { load(); }, []);

  return (
    <section className="bg-slate-900 neon-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Accounts</h2>
        <button
          onClick={() => { setCreateError(""); setShowCreate(true); }}
          className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors neon-glow-sm"
        >
          + Nieuw account
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 px-3 py-2.5 bg-red-900/20 border border-red-500/30 rounded-lg">
          <span className="text-sm font-medium text-red-400">
            {selectedIds.size} account{selectedIds.size !== 1 ? "s" : ""} geselecteerd
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
      {bulkError && <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{bulkError}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-800">
              <th className="pb-2 pr-3 w-8">
                <input
                  type="checkbox"
                  checked={accounts.length > 0 && accounts.every((a) => selectedIds.has(a.id))}
                  ref={(el) => {
                    if (el)
                      el.indeterminate =
                        accounts.some((a) => selectedIds.has(a.id)) &&
                        !accounts.every((a) => selectedIds.has(a.id));
                  }}
                  onChange={toggleSelectAll}
                  className="rounded accent-cyan-500"
                />
              </th>
              <th className="pb-2 font-semibold">Naam</th>
              <th className="pb-2 font-semibold">Rol</th>
              <th className="pb-2 font-semibold hidden sm:table-cell">E-mail</th>
              <th className="pb-2 font-semibold text-right">Acties</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr
                key={a.id}
                className={`border-b border-slate-800/60 ${
                  selectedIds.has(a.id) ? "bg-red-900/10" : "hover:bg-slate-800/30"
                }`}
              >
                <td className="py-2 pr-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(a.id)}
                    onChange={() => toggleSelect(a.id)}
                    className="rounded accent-cyan-500"
                  />
                </td>
                <td className="py-2 font-medium text-white">{a.name ?? <span className="text-slate-500 italic">Geen naam</span>}</td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    a.role === "ADMIN"
                      ? "bg-purple-900/40 text-purple-400 border-purple-500/30"
                      : "bg-blue-900/40 text-blue-400 border-blue-500/30"
                  }`}>
                    {a.role === "ADMIN" ? "Admin" : `Manager${a.managedTeam ? ` · ${TEAM_LABEL[a.managedTeam] ?? a.managedTeam}` : ""}`}
                  </span>
                </td>
                <td className="py-2 text-slate-400 text-xs hidden sm:table-cell">{a.email}</td>
                <td className="py-2 text-right">
                  <button onClick={() => openModal(a)} className={BTN_SMALL}>Bewerken</button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-slate-500 text-sm">Geen accounts gevonden.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Nieuw account modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Nieuw account aanmaken</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className={LABEL}>Naam</label>
                <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className={INPUT} placeholder="Jan Janssen" />
              </div>
              <div>
                <label className={LABEL}>E-mailadres *</label>
                <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className={INPUT} placeholder="jan@voorbeeld.nl" />
              </div>
              <div>
                <label className={LABEL}>Wachtwoord *</label>
                <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className={INPUT} placeholder="Tijdelijk wachtwoord" />
                <p className="text-xs text-slate-600 mt-1">De gebruiker moet dit bij eerste inlog wijzigen.</p>
              </div>
              <div>
                <label className={LABEL}>Rol</label>
                <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className={SELECT}>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
              {createForm.role === "MANAGER" && (
                <div>
                  <label className={LABEL}>Elftal</label>
                  <select value={createForm.managedTeam} onChange={(e) => setCreateForm({ ...createForm, managedTeam: e.target.value })} className={SELECT}>
                    {TEAMS.map((t) => <option key={t} value={t}>{TEAM_LABEL[t]}</option>)}
                  </select>
                </div>
              )}
              {createError && <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">{createError}</p>}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className={BTN_SECONDARY}>Annuleer</button>
              <button onClick={createAccount} disabled={creating || !createForm.email || !createForm.password} className={BTN_PRIMARY}>
                {creating ? "Aanmaken..." : "Account aanmaken"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bewerk modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 neon-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{modal.name ?? modal.email}</h3>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className={LABEL}>Naam</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>E-mailadres</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Rol</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={SELECT}>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
              {form.role === "MANAGER" && (
                <div>
                  <label className={LABEL}>Elftal</label>
                  <select value={form.managedTeam} onChange={(e) => setForm({ ...form, managedTeam: e.target.value })} className={SELECT}>
                    {TEAMS.map((t) => <option key={t} value={t}>{TEAM_LABEL[t]}</option>)}
                  </select>
                </div>
              )}
              {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
            </div>

            <div className="border-t border-slate-800 pt-4 mb-5">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Wachtwoord wijzigen</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPwMsg(""); }}
                  placeholder="Nieuw wachtwoord"
                  className={INPUT + " flex-1"}
                />
                <button onClick={savePassword} disabled={pwSaving || !newPassword.trim()} className={BTN_PRIMARY}>
                  {pwSaving ? "..." : "Opslaan"}
                </button>
              </div>
              {pwMsg && (
                <p className={`text-xs mt-1.5 ${pwMsg === "Wachtwoord gewijzigd" ? "text-green-400" : "text-red-400"}`}>{pwMsg}</p>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4 mb-5">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Inloglink</p>
              <button onClick={generateLink} disabled={linkLoading} className={BTN_SMALL}>
                {linkLoading ? "Genereren..." : "Genereer eenmalige inloglink"}
              </button>
              {loginLink && (
                <div className="mt-3 flex gap-2">
                  <input readOnly value={loginLink} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-400 font-mono focus:outline-none" />
                  <button onClick={() => navigator.clipboard.writeText(loginLink)} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg">Kopieer</button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setModal(null)} className={BTN_SECONDARY}>Annuleer</button>
              <button onClick={save} disabled={saving} className={BTN_PRIMARY}>{saving ? "Opslaan..." : "Opslaan"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
