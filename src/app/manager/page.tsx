import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import ManagerClient from "./ManagerClient";

const TEAM_LABEL: Record<string, string> = {
  ONE: "Elftal 1", TWO: "Elftal 2", THREE: "Elftal 3",
  FOUR: "Elftal 4", FIVE: "Elftal 5", DAMES: "Dames",
};
const TEAMS = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"];

export default async function ManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "MANAGER" && session.role !== "ADMIN")) {
    redirect("/login?redirect=/manager");
  }

  let effectiveTeam = session.managedTeam;

  if (!effectiveTeam) {
    if (session.role !== "ADMIN") {
      return (
        <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-8"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(14,40,80,0.7) 0%, #060b14 70%)" }}>
          <div className="bg-slate-900 neon-border rounded-2xl p-8 max-w-md w-full text-center">
            <h1 className="text-xl font-bold text-white mb-2">Geen elftal toegewezen</h1>
            <p className="text-slate-500 text-sm">
              Je bent nog niet gekoppeld aan een elftal. Neem contact op met de admin.
            </p>
          </div>
        </div>
      );
    }

    const { team } = await searchParams;
    if (!team || !TEAMS.includes(team)) {
      return (
        <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-8"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(14,40,80,0.7) 0%, #060b14 70%)" }}>
          <div className="bg-slate-900 neon-border rounded-2xl p-8 max-w-md w-full">
            <h1 className="text-xl font-bold text-white mb-1">Wedstrijdbeheer</h1>
            <p className="text-slate-500 text-sm mb-6">Kies een elftal om te beheren:</p>
            <div className="grid grid-cols-2 gap-3">
              {TEAMS.map((t) => (
                <Link
                  key={t}
                  href={`/manager?team=${t}`}
                  className="block text-center py-3 px-4 bg-slate-800 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-400 font-semibold rounded-xl border border-slate-700 hover:border-cyan-500/30 transition-colors"
                >
                  {TEAM_LABEL[t]}
                </Link>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">← Terug naar admin</Link>
            </div>
          </div>
        </div>
      );
    }

    effectiveTeam = team;
  }

  return (
    <ManagerClient
      managedTeam={effectiveTeam}
      managerName={session.name ?? session.email}
      isAdmin={session.role === "ADMIN"}
    />
  );
}
