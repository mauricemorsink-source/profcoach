"use client";

import { useState, useEffect } from "react";

const BTN_PRIMARY = "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors neon-glow-sm";
const BTN_SECONDARY = "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-sm transition-colors border border-slate-700";
const BTN_DANGER = "px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors";

export default function ManagerLinkClient() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/manager-link");
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      setCreatedAt(data.createdAt);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function generate() {
    setGenerating(true);
    const res = await fetch("/api/admin/manager-link", { method: "POST" });
    const data = await res.json();
    setGenerating(false);
    setConfirming(false);
    if (res.ok) {
      setToken(data.token);
      setCreatedAt(data.createdAt);
    }
  }

  const url = token && typeof window !== "undefined" ? `${window.location.origin}/manager/${token}` : "";

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="bg-slate-900 neon-border rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-1">Wedstrijd indienen (managers)</h2>
      <p className="text-slate-500 text-sm mb-5">
        Deel deze link met de teams. Wie de link opent kiest een elftal en kan direct wedstrijden indienen — zonder
        account. De link staat niet in de sitemap en is niet te raden, maar wel openbaar bereikbaar: houd hem alleen
        binnen de club en deel hem niet ergens publiek.
      </p>

      {token === undefined ? (
        <p className="text-slate-500 text-sm">Laden...</p>
      ) : token ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
              className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono"
            />
            <button onClick={copy} className={BTN_PRIMARY}>
              {copied ? "Gekopieerd!" : "Kopiëren"}
            </button>
          </div>
          {createdAt && (
            <p className="text-xs text-slate-600">Aangemaakt op {new Date(createdAt).toLocaleDateString("nl-NL")}</p>
          )}

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Nieuwe link genereren (oude link stopt met werken)
            </button>
          ) : (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-red-300">Weet je het zeker? De huidige link werkt dan niet meer.</p>
              <div className="flex gap-2 shrink-0">
                <button onClick={generate} disabled={generating} className={BTN_DANGER}>
                  Bevestig
                </button>
                <button onClick={() => setConfirming(false)} className={BTN_SECONDARY}>
                  Annuleer
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button onClick={generate} disabled={generating} className={BTN_PRIMARY}>
          {generating ? "Bezig..." : "Genereer link"}
        </button>
      )}
    </section>
  );
}
