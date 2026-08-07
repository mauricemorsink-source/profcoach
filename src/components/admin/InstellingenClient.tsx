"use client";

import { useState, useEffect } from "react";

type GameSettings = {
  budget: number;
  deadline: string | null;
  registrationOpen: boolean;
  requireLogin: boolean;
  inschrijfgeld: number;
  captainEnabled: boolean;
  captainBonusPerWin: number;
  showTussenstand: boolean;
  showStatistieken: boolean;
  wijzigingsvensterOpen: boolean;
};

const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
const LABEL = "block text-sm font-medium text-slate-400 mb-1";
const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";

export default function InstellingenClient() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<GameSettings>({
    budget: 1750,
    deadline: null,
    registrationOpen: true,
    requireLogin: true,
    inschrijfgeld: 0,
    captainEnabled: false,
    captainBonusPerWin: 5,
    showTussenstand: true,
    showStatistieken: true,
    wijzigingsvensterOpen: false,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function loadSettings() {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data: GameSettings = await res.json();
      setSettings(data);
      setSettingsForm({
        budget: data.budget,
        deadline: data.deadline ? data.deadline.slice(0, 16) : "",
        registrationOpen: data.registrationOpen,
        requireLogin: data.requireLogin ?? true,
        inschrijfgeld: (data.inschrijfgeld ?? 0) / 100,
        captainEnabled: data.captainEnabled ?? false,
        captainBonusPerWin: data.captainBonusPerWin ?? 5,
        showTussenstand: data.showTussenstand ?? true,
        showStatistieken: data.showStatistieken ?? true,
        wijzigingsvensterOpen: data.wijzigingsvensterOpen ?? false,
      });
    }
  }

  async function saveSettings() {
    setSettingsSaving(true);
    setSettingsMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budget: Number(settingsForm.budget),
        deadline: settingsForm.deadline || null,
        registrationOpen: settingsForm.registrationOpen,
        requireLogin: settingsForm.requireLogin,
        inschrijfgeld: Number(settingsForm.inschrijfgeld),
        captainEnabled: settingsForm.captainEnabled,
        captainBonusPerWin: Number(settingsForm.captainBonusPerWin),
        showTussenstand: settingsForm.showTussenstand,
        showStatistieken: settingsForm.showStatistieken,
        wijzigingsvensterOpen: settingsForm.wijzigingsvensterOpen,
      }),
    });
    const data = await res.json();
    setSettingsSaving(false);
    if (!res.ok) {
      setSettingsMsg({ type: "err", text: data.error || "Opslaan mislukt" });
    } else {
      setSettings(data);
      setSettingsForm({
        budget: data.budget,
        deadline: data.deadline ? data.deadline.slice(0, 16) : "",
        registrationOpen: data.registrationOpen,
        requireLogin: data.requireLogin ?? true,
        inschrijfgeld: (data.inschrijfgeld ?? 0) / 100,
        captainEnabled: data.captainEnabled ?? false,
        captainBonusPerWin: data.captainBonusPerWin ?? 5,
        showTussenstand: data.showTussenstand ?? true,
        showStatistieken: data.showStatistieken ?? true,
        wijzigingsvensterOpen: data.wijzigingsvensterOpen ?? false,
      });
      setSettingsMsg({ type: "ok", text: "Instellingen opgeslagen" });
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="max-w-4xl">
      <section className="bg-slate-900 neon-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-5">Spelinstellingen</h2>
        {!settings ? (
          <p className="text-slate-500 text-sm">Laden...</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={LABEL}>Budget (max. teamwaarde)</label>
                <input
                  type="number"
                  value={settingsForm.budget}
                  onChange={(e) => setSettingsForm({ ...settingsForm, budget: Number(e.target.value) })}
                  className={INPUT}
                  min="1"
                />
              </div>
              <div>
                <label className={LABEL}>Deadline (team invullen tot)</label>
                <input
                  type="datetime-local"
                  value={settingsForm.deadline ?? ""}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deadline: e.target.value || null })}
                  className={INPUT + " max-w-xs"}
                />
                {settingsForm.deadline && (
                  <button
                    onClick={() => setSettingsForm({ ...settingsForm, deadline: null })}
                    className="text-xs text-slate-500 hover:text-slate-300 mt-1 transition-colors"
                  >
                    Deadline verwijderen
                  </button>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.registrationOpen}
                    onChange={(e) => setSettingsForm({ ...settingsForm, registrationOpen: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
                <span className="text-sm font-medium text-slate-300">Registratie open</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    settingsForm.registrationOpen
                      ? "bg-green-900/40 text-green-400 border border-green-500/30"
                      : "bg-red-900/40 text-red-400 border border-red-500/30"
                  }`}
                >
                  {settingsForm.registrationOpen ? "Aan" : "Uit"}
                </span>
              </div>
              {settingsForm.registrationOpen && settingsForm.deadline && new Date(settingsForm.deadline) < new Date() && (
                <p className="mt-1.5 text-xs text-amber-400 bg-amber-900/20 border border-amber-500/30 px-3 py-2 rounded-lg">
                  Let op: de deadline (
                  {new Date(settingsForm.deadline).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}) is al
                  verstreken. Nieuwe aanmeldingen worden geblokkeerd totdat de deadline wordt aangepast of verwijderd.
                </p>
              )}
            </div>
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inschrijving zonder account</p>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!settingsForm.requireLogin}
                    onChange={(e) => setSettingsForm({ ...settingsForm, requireLogin: !e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
                <span className="text-sm font-medium text-slate-300">Inschrijven zonder account (via Team indienen)</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${!settingsForm.requireLogin ? "bg-green-900/40 text-green-400 border border-green-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"}`}>
                  {!settingsForm.requireLogin ? "Aan" : "Uit"}
                </span>
              </div>
              <div className="flex items-center gap-3 ml-14">
                <label className="text-sm text-slate-400 shrink-0">Inschrijfgeld</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-sm">€</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settingsForm.inschrijfgeld}
                    onChange={(e) => setSettingsForm({ ...settingsForm, inschrijfgeld: Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-24 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                    placeholder="15.00"
                  />
                </div>
                <span className="text-xs text-slate-500">in euro&apos;s (bijv. 15.00) — wordt getoond bij het indienen</span>
              </div>
            </div>
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Winterstop / Team aanpassen</p>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.wijzigingsvensterOpen}
                    onChange={(e) => setSettingsForm({ ...settingsForm, wijzigingsvensterOpen: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
                <span className="text-sm font-medium text-slate-300">Wijzigingsvenster open</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${settingsForm.wijzigingsvensterOpen ? "bg-amber-900/40 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"}`}>
                  {settingsForm.wijzigingsvensterOpen ? "Open" : "Gesloten"}
                </span>
              </div>
              {settingsForm.wijzigingsvensterOpen && (
                <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-500/20 rounded-lg px-3 py-2 ml-14">
                  Deelnemers kunnen nu via <strong>/team-aanpassen</strong> hun opstelling en aanvoerder wijzigen via een e-maillink.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.captainEnabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, captainEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
              <span className="text-sm font-medium text-slate-300">Aanvoerder verplicht</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  settingsForm.captainEnabled
                    ? "bg-green-900/40 text-green-400 border border-green-500/30"
                    : "bg-red-900/40 text-red-400 border border-red-500/30"
                }`}
              >
                {settingsForm.captainEnabled ? "Aan" : "Uit"}
              </span>
              <span className="text-xs text-slate-500">— aanvoerder krijgt</span>
              <input
                type="number"
                min="0"
                value={settingsForm.captainBonusPerWin}
                onChange={(e) => setSettingsForm({ ...settingsForm, captainBonusPerWin: Number(e.target.value) })}
                disabled={!settingsForm.captainEnabled}
                className="w-14 bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/40 disabled:opacity-40"
              />
              <span className="text-xs text-slate-500">pt per overwinning</span>
            </div>
            <div className="border-t border-slate-800 pt-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Zichtbaarheid voor deelnemers</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.showTussenstand}
                      onChange={(e) => setSettingsForm({ ...settingsForm, showTussenstand: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                  <span className="text-sm font-medium text-slate-300">Tussenstand zichtbaar</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      settingsForm.showTussenstand
                        ? "bg-green-900/40 text-green-400 border border-green-500/30"
                        : "bg-red-900/40 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {settingsForm.showTussenstand ? "Zichtbaar" : "Verborgen"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.showStatistieken}
                      onChange={(e) => setSettingsForm({ ...settingsForm, showStatistieken: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                  <span className="text-sm font-medium text-slate-300">Statistieken zichtbaar</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      settingsForm.showStatistieken
                        ? "bg-green-900/40 text-green-400 border border-green-500/30"
                        : "bg-red-900/40 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {settingsForm.showStatistieken ? "Zichtbaar" : "Verborgen"}
                  </span>
                </div>
              </div>
            </div>
            {settingsMsg && (
              <p
                className={`text-sm px-3 py-2 rounded-lg border ${
                  settingsMsg.type === "ok"
                    ? "bg-green-900/20 text-green-400 border-green-500/30"
                    : "bg-red-900/20 text-red-400 border-red-500/30"
                }`}
              >
                {settingsMsg.text}
              </p>
            )}
            <button onClick={saveSettings} disabled={settingsSaving} className={BTN_PRIMARY}>
              {settingsSaving ? "Opslaan..." : "Instellingen opslaan"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
