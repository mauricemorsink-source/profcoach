import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CountdownTimer from "@/components/CountdownTimer";

export default async function HomePage() {
  const session = await getSession();
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  const registrationOpen = settings?.registrationOpen ?? false;
  const deadline = settings?.deadline ? new Date(settings.deadline) : null;
  const showCountdown = registrationOpen && deadline && deadline > new Date();

  return (
    <div className="relative min-h-[calc(100vh-56px)] flex flex-col items-center justify-center p-8 overflow-hidden bg-[#060b14]">

      {/* Achtergrond foto - subtiel */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/veld.avif')", opacity: 0.15 }}
      />

      {/* Donkere vignette — randen volledig donker, midden licht zichtbaar */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(6,11,20,0.1) 0%, rgba(6,11,20,0.6) 65%, #060b14 88%)" }}
      />

      {/* Bewegende blauwe gloed */}
      <div
        className="absolute pointer-events-none bg-glow-animated"
        style={{
          top: "40%", left: "50%",
          width: "70%", height: "70%",
          background: "radial-gradient(ellipse, rgba(20,80,200,0.45) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 text-center mb-10">
        <h1 className="text-6xl font-black text-white tracking-tight mb-3"
          style={{ textShadow: "0 0 40px rgba(34,211,238,0.4), 0 0 80px rgba(34,211,238,0.1)" }}>
          ProfCoach
        </h1>
        <p className="text-slate-400 text-lg">
          Stel jouw droomteam samen en strijd om de beste opstelling
        </p>
      </div>

      <div className="relative z-10 bg-slate-900 neon-border-animated rounded-2xl p-8 w-full max-w-sm space-y-3 shadow-2xl">
        {session ? (
          <>
            <p className="text-center text-slate-400 text-sm pb-1">
              Welkom terug,{" "}
              <span className="font-semibold text-white">{session.name ?? session.email}</span>
            </p>
            <Link href="/play" className="block w-full text-center py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-lg transition-colors neon-glow-sm">
              Mijn team
            </Link>
            {showCountdown && <CountdownTimer deadline={deadline!.toISOString()} />}
            <Link href="/tussenstand" className="block w-full text-center py-3 px-6 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-xl text-lg border border-cyan-500/20 transition-colors">
              Tussenstand
            </Link>
          </>
        ) : (
          <>
            {registrationOpen ? (
              <Link href="/register" className="block w-full text-center py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-lg transition-colors neon-glow-sm">
                Deelnemen
              </Link>
            ) : (
              <div className="w-full text-center py-3 px-6 bg-slate-800/50 text-slate-500 font-bold rounded-xl text-lg border border-slate-700/50 cursor-not-allowed">
                Inschrijving gesloten
              </div>
            )}
            {showCountdown && <CountdownTimer deadline={deadline!.toISOString()} />}
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
