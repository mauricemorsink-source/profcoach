"use client";

import { useState } from "react";

export default function TeamAanpassenRequestClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/team/request-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Er is iets misgegaan.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Verbindingsfout. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#060b14] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-black text-white mb-3">Check je mail</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Als er een team is ingeschreven met dit e-mailadres, ontvang je binnen een paar minuten een link om je team aan te passen. De link is 48 uur geldig.
          </p>
          <p className="text-slate-600 text-xs mt-4">
            Geen mail ontvangen? Controleer je spam of neem contact op met de organisatie.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black text-white mb-2">Team aanpassen</h1>
          <p className="text-slate-400 text-sm">
            Vul het e-mailadres in waarmee je je team hebt ingeschreven. Je ontvangt een link om je team te bewerken.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              E-mailadres
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jouw@email.nl"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50"
          >
            {loading ? "Versturen…" : "Stuur aanpas-link"}
          </button>
        </form>
      </div>
    </div>
  );
}
