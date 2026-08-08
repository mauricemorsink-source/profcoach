import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 sm:p-8"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(14,40,80,0.7) 0%, #060b14 70%)" }}
    >
      <div className="bg-slate-900 neon-border rounded-2xl p-8 sm:p-10 w-full max-w-sm text-center shadow-2xl">
        <div
          className="flex items-center justify-center gap-1 text-6xl sm:text-7xl font-black text-white mb-3"
          style={{ textShadow: "0 0 24px rgba(34,211,238,0.35)" }}
        >
          <span>4</span>
          <span className="inline-block animate-bounce">⚽</span>
          <span>4</span>
        </div>
        <h1 className="text-lg font-black text-white mb-1">🚩 Buitenspel!</h1>
        <p className="text-slate-400 text-sm mb-6">
          De VAR heeft het helemaal nagekeken, maar deze pagina bestaat gewoon niet.
        </p>

        <div className="space-y-2">
          <Link
            href="/"
            className="block w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm transition-colors neon-glow-sm"
          >
            ← Terug naar het veld
          </Link>
          <Link
            href="/tussenstand"
            className="block w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-xl text-sm border border-cyan-500/20 transition-colors"
          >
            Bekijk de tussenstand
          </Link>
        </div>
      </div>
    </div>
  );
}
