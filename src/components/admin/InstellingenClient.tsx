"use client";

import { useState, useEffect } from "react";

type GameSettings = {
  budget: number;
  deadline: string | null;
  registrationOpen: boolean;
  captainEnabled: boolean;
  captainBonusPerWin: number;
  showTussenstand: boolean;
  showStatistieken: boolean;
  rulesText: string;
  termsText: string;
  privacyText: string;
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
    captainEnabled: false,
    captainBonusPerWin: 5,
    showTussenstand: true,
    showStatistieken: true,
    rulesText: "",
    termsText: "",
    privacyText: "",
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
        captainEnabled: data.captainEnabled ?? false,
        captainBonusPerWin: data.captainBonusPerWin ?? 5,
        showTussenstand: data.showTussenstand ?? true,
        showStatistieken: data.showStatistieken ?? true,
        rulesText: data.rulesText ?? "",
        termsText: data.termsText ?? "",
        privacyText: data.privacyText ?? "",
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
        captainEnabled: settingsForm.captainEnabled,
        captainBonusPerWin: Number(settingsForm.captainBonusPerWin),
        showTussenstand: settingsForm.showTussenstand,
        showStatistieken: settingsForm.showStatistieken,
        rulesText: settingsForm.rulesText,
        termsText: settingsForm.termsText,
        privacyText: settingsForm.privacyText,
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
        captainEnabled: data.captainEnabled ?? false,
        captainBonusPerWin: data.captainBonusPerWin ?? 5,
        showTussenstand: data.showTussenstand ?? true,
        showStatistieken: data.showStatistieken ?? true,
        rulesText: data.rulesText ?? "",
        termsText: data.termsText ?? "",
        privacyText: data.privacyText ?? "",
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
            <div>
              <label className={LABEL}>Spelregels</label>
              <textarea
                value={settingsForm.rulesText}
                onChange={(e) => setSettingsForm({ ...settingsForm, rulesText: e.target.value })}
                rows={12}
                className={INPUT + " resize-y font-mono text-sm"}
                placeholder={"## Spelregels\n\nSchrijf hier de spelregels in markdown-opmaak."}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Markdown: <span className="text-slate-400 font-mono">## Koptekst</span> ·{" "}
                <span className="text-slate-400 font-mono">**vet**</span> ·{" "}
                <span className="text-slate-400 font-mono">- lijstitem</span>
              </p>
            </div>
            <div>
              <label className={LABEL}>
                Algemene voorwaarden <span className="text-slate-600 font-normal">(/terms)</span>
              </label>
              <textarea
                value={settingsForm.termsText}
                onChange={(e) => setSettingsForm({ ...settingsForm, termsText: e.target.value })}
                rows={8}
                className={INPUT + " resize-y font-mono text-sm"}
                placeholder={"## Algemene voorwaarden\n\nSchrijf hier de algemene voorwaarden in markdown-opmaak."}
              />
            </div>
            <div>
              <label className={LABEL}>
                Privacybeleid <span className="text-slate-600 font-normal">(/privacy)</span>
              </label>
              <textarea
                value={settingsForm.privacyText}
                onChange={(e) => setSettingsForm({ ...settingsForm, privacyText: e.target.value })}
                rows={8}
                className={INPUT + " resize-y font-mono text-sm"}
                placeholder={"## Privacybeleid\n\nSchrijf hier het privacybeleid in markdown-opmaak."}
              />
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
