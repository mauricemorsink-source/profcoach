import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MobileMenu from "./MobileMenu";

export default async function NavBar() {
  const [session, settings] = await Promise.all([
    getSession(),
    prisma.gameSettings.findUnique({ where: { id: "singleton" }, select: { requireLogin: true } }),
  ]);
  const requireLogin = settings?.requireLogin ?? true;
  const isStaff = session?.role === "ADMIN" || session?.role === "MANAGER";

  return (
    <nav className="relative bg-slate-900/95 border-b border-cyan-500/15 sticky top-0 z-40 backdrop-blur-sm" style={{ boxShadow: "0 1px 20px rgba(34,211,238,0.08)" }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">

        {/* Logo */}
        <Link href="/" className="shrink-0 mr-1 flex items-center gap-2">
          <Image src="/file-removebg-preview.png" alt="ProfCoach" width={32} height={32} className="object-contain" />
          <span className="font-black text-lg tracking-tight text-white" style={{ textShadow: "0 0 20px rgba(34,211,238,0.5)" }}>ProfCoach</span>
        </Link>

        {/* Desktop: primaire navigatie */}
        <div className="hidden sm:flex items-center gap-0.5 flex-1 min-w-0">
          {session && !isStaff && (session.isParticipant ?? true) && (
            <Link href="/mijn-team" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white hover:bg-cyan-500/10 hover:text-cyan-300 whitespace-nowrap transition-colors">
              Mijn team
            </Link>
          )}
          <Link href="/tussenstand" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white hover:bg-cyan-500/10 hover:text-cyan-300 whitespace-nowrap transition-colors">
            Tussenstand
          </Link>
          <Link href="/spelers" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800 whitespace-nowrap transition-colors">
            Spelers
          </Link>
          <Link href="/spelregels" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800 whitespace-nowrap transition-colors">
            Spelregels
          </Link>
        </div>

        {/* Spacer op mobile */}
        <div className="flex-1 sm:hidden" />

        {/* Mobile: directe knop */}
        {!requireLogin && !session && (
          <Link href="/team-indienen" className="sm:hidden px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-cyan-600 whitespace-nowrap transition-colors">
            Team indienen
          </Link>
        )}
        {session && !isStaff && (session.isParticipant ?? true) && (
          <Link href="/mijn-team" className="sm:hidden px-3 py-1.5 rounded-lg text-sm font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 whitespace-nowrap transition-colors">
            Mijn team
          </Link>
        )}

        {/* Desktop: secundaire navigatie */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          {session?.role === "ADMIN" && (
            <Link href="/admin" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 whitespace-nowrap transition-colors">
              Admin
            </Link>
          )}
          {(session?.role === "MANAGER" || session?.role === "ADMIN") && (
            <Link href="/manager" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 whitespace-nowrap transition-colors">
              Manager
            </Link>
          )}
          {session ? (
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                Uitloggen
              </button>
            </form>
          ) : !requireLogin ? (
            <Link href="/team-indienen" className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap transition-colors" style={{ boxShadow: "0 0 8px rgba(34,211,238,0.3)" }}>
              Team indienen
            </Link>
          ) : null}
        </div>

        {/* Mobile: hamburger menu */}
        <MobileMenu session={session} requireLogin={requireLogin} />

      </div>
    </nav>
  );
}
