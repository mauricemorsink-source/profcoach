import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getContentMap } from "@/lib/content";
import CountdownTimer from "@/components/CountdownTimer";
import RegistrationClosedNotice from "@/components/RegistrationClosedNotice";

export default async function HomePage() {
  const [session, settings, content] = await Promise.all([
    getSession(),
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
    getContentMap(["home.tagline", "meldingen.registratie_gesloten_titel", "meldingen.registratie_gesloten_tekst"]),
  ]);
  const registrationOpen = settings?.registrationOpen ?? false;
  const requireLogin = settings?.requireLogin ?? true;
  const deadline = settings?.deadline ? new Date(settings.deadline) : null;
  const deadlinePassed = !!deadline && deadline <= new Date();
  const registrationClosed = !registrationOpen || deadlinePassed;
  const showCountdown = !registrationClosed && !!deadline;

  return (
    <div className="relative min-h-[calc(100vh-56px)] flex flex-col items-center justify-center p-8 overflow-hidden bg-[#060b14]">

      <style>{`
        @keyframes glowFloat {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          30%       { transform: translate(-42%, -58%) scale(1.12); }
          65%       { transform: translate(-58%, -44%) scale(0.91); }
        }
        @keyframes borderGlow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(34,211,238,0.1), 0 0 30px rgba(34,211,238,0.04);
            border-color: rgba(34,211,238,0.28);
          }
          50% {
            box-shadow: 0 0 22px rgba(34,211,238,0.3), 0 0 55px rgba(34,211,238,0.12);
            border-color: rgba(34,211,238,0.65);
          }
        }
      `}</style>

      {/* Achtergrond foto - subtiel */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/veld.webp')", opacity: 0.15 }}
      />

      {/* Donkere vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(6,11,20,0.1) 0%, rgba(6,11,20,0.6) 65%, #060b14 88%)" }}
      />

      {/* Bewegende blauwe gloed */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "40%", left: "50%",
          width: "70%", height: "70%",
          background: "radial-gradient(ellipse, rgba(20,80,200,0.45) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "glowFloat 18s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      <div className="relative z-10 text-center mb-10">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className="absolute pointer-events-none"
              style={{
                inset: "-80px",
                background: "radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.22) 0%, rgba(34,211,238,0.06) 45%, transparent 70%)",
                filter: "blur(24px)",
              }}
            />
            <Image
              src="/file-removebg-preview.png"
              alt="ProfCoach"
              width={220}
              height={220}
              className="relative object-contain"
            />
          </div>
        </div>
        <p className="text-slate-400 text-lg">
          {content["home.tagline"]}
        </p>
      </div>

      <div
        className="relative z-10 bg-slate-900 rounded-2xl p-8 w-full max-w-sm space-y-3 shadow-2xl"
        style={{
          border: "1px solid rgba(34,211,238,0.28)",
          boxShadow: "0 0 10px rgba(34,211,238,0.1)",
          animation: "borderGlow 4s ease-in-out infinite",
        }}
      >
        {session ? (
          <>
            <p className="text-center text-slate-400 text-sm pb-1">
              Welkom terug,{" "}
              <span className="font-semibold text-white">{session.name ?? session.email}</span>
            </p>
            <Link href="/mijn-team" className="block w-full text-center py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-lg transition-colors neon-glow-sm">
              Mijn team
            </Link>
            {registrationClosed ? (
              <RegistrationClosedNotice
                compact
                title={content["meldingen.registratie_gesloten_titel"]}
                text={content["meldingen.registratie_gesloten_tekst"]}
              />
            ) : (
              showCountdown && <CountdownTimer deadline={deadline!.toISOString()} />
            )}
            <Link href="/tussenstand" className="block w-full text-center py-3 px-6 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-xl text-lg border border-cyan-500/20 transition-colors">
              Tussenstand
            </Link>
          </>
        ) : (
          <>
            {registrationClosed ? (
              <RegistrationClosedNotice
                compact
                title={content["meldingen.registratie_gesloten_titel"]}
                text={content["meldingen.registratie_gesloten_tekst"]}
              />
            ) : !requireLogin ? (
              <Link href="/team-indienen" className="block w-full text-center py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-lg transition-colors neon-glow-sm">
                Team samenstellen
              </Link>
            ) : (
              <Link href="/login" className="block w-full text-center py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-lg transition-colors neon-glow-sm">
                Inloggen om mee te doen
              </Link>
            )}
            {showCountdown && <CountdownTimer deadline={deadline!.toISOString()} />}
            <Link href="/tussenstand" className="block w-full text-center py-3 px-6 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-xl text-lg border border-cyan-500/20 transition-colors">
              Tussenstand bekijken
            </Link>
            <Link href="/spelregels" className="block w-full text-center py-2.5 px-6 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              Spelregels
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
