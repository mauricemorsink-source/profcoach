"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Er is een fout opgetreden"); setLoading(false); return; }

    router.push("/play");
    router.refresh();
  }

  const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
  const LABEL = "block text-sm font-medium text-slate-400 mb-1.5";

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-8"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(14,40,80,0.7) 0%, #060b14 70%)" }}>
      <div className="bg-slate-900 neon-border rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-white">Account aanmaken</h1>
          <p className="text-slate-500 text-sm mt-1">Doe mee met ProfCoach</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL}>Naam <span className="text-slate-600">(optioneel)</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} placeholder="Jouw naam" />
          </div>
          <div>
            <label className={LABEL}>E-mailadres</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={INPUT} placeholder="jouw@email.nl" />
          </div>
          <div>
            <label className={LABEL}>Wachtwoord</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className={INPUT + " pr-16"} placeholder="Minimaal 8 tekens" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs transition-colors" tabIndex={-1}>
                {showPassword ? "Verberg" : "Toon"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors neon-glow-sm">
            {loading ? "Registreren..." : "Account aanmaken"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Al een account?{" "}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Inloggen</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
