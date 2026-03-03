import Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center p-8"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(14,40,80,0.8) 0%, #060b14 70%)" }}>
      <div className="text-center mb-10">
        <h1 className="text-6xl font-black text-white tracking-tight mb-3"
          style={{ textShadow: "0 0 40px rgba(34,211,238,0.4), 0 0 80px rgba(34,211,238,0.1)" }}>
          ProfCoach
        </h1>
        <p className="text-slate-400 text-lg">
          Stel jouw droomteam samen en strijd om de beste opstelling
        </p>
      </div>

      <div className="bg-slate-900 neon-border rounded-2xl p-8 w-full max-w-sm space-y-3 shadow-2xl">
        {session ? (
          <>
            <p className="text-center text-slate-400 text-sm pb-1">
              Welkom terug,{" "}
              <span className="font-semibold text-white">{session.name ?? session.email}</span>
            </p>
            <Link href="/play" className="block w-full text-center py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-lg transition-colors neon-glow-sm">
              Mijn team
            </Link>
            <Link href="/tussenstand" className="block w-full text-center py-3 px-6 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-xl text-lg border border-cyan-500/20 transition-colors">
              Tussenstand
            </Link>
          </>
        ) : (
          <>
            <Link href="/register" className="block w-full text-center py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-lg transition-colors neon-glow-sm">
              Deelnemen
            </Link>
            <Link href="/tussenstand" className="block w-full text-center py-3 px-6 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-xl text-lg border border-cyan-500/20 transition-colors">
              Tussenstand bekijken
            </Link>
            <Link href="/rules" className="block w-full text-center py-2.5 px-6 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              Spelregels
            </Link>
            <p className="text-center text-sm text-slate-500 pt-1">
              Al een account?{" "}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Inloggen</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
