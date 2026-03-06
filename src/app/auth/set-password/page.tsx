"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Wachtwoord moet minimaal 6 tekens zijn.");
      return;
    }
    if (password !== confirm) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Er is iets misgegaan.");
      } else {
        router.push("/");
      }
    } catch {
      setError("Netwerkfout. Probeer opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-[calc(100vh-56px)] flex items-center justify-center p-8"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(14,40,80,0.7) 0%, #060b14 70%)" }}
    >
      <div className="bg-slate-900 neon-border rounded-2xl p-8 max-w-sm w-full">
        <h1 className="text-xl font-bold text-white mb-1">Kies een wachtwoord</h1>
        <p className="text-slate-500 text-sm mb-6">
          Stel een persoonlijk wachtwoord in voor je account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nieuw wachtwoord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              placeholder="Minimaal 6 tekens"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Herhaal wachtwoord</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              placeholder="Zelfde wachtwoord"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold rounded-lg text-sm transition-colors"
          >
            {loading ? "Opslaan..." : "Wachtwoord instellen"}
          </button>
        </form>
      </div>
    </div>
  );
}
