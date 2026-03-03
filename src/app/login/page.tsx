"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/play";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Er is een fout opgetreden"); setLoading(false); return; }

    router.push(redirect);
    router.refresh();
  }

  const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
  const LABEL = "block text-sm font-medium text-slate-400 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={LABEL}>E-mailadres</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={INPUT} placeholder="jouw@email.nl" />
      </div>
      <div>
        <label className={LABEL}>Wachtwoord</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className={INPUT + " pr-16"} placeholder="••••••••" />
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs transition-colors" tabIndex={-1}>
            {showPassword ? "Verberg" : "Toon"}
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="w-4 h-4 rounded accent-cyan-500"
        />
        <span className="text-sm text-slate-400">Blijf ingelogd</span>
      </label>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button type="submit" disabled={loading} className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors neon-glow-sm">
        {loading ? "Inloggen..." : "Inloggen"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Nog geen account?{" "}
        <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">Registreren</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-8"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(14,40,80,0.7) 0%, #060b14 70%)" }}>
      <div className="bg-slate-900 neon-border rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-white">Inloggen</h1>
          <p className="text-slate-500 text-sm mt-1">Welkom terug bij ProfCoach</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
