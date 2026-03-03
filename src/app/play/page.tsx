import { prisma } from "@/lib/prisma";
import TeamBuilder from "@/components/team/TeamBuilder";
import Link from "next/link";

export default async function PlayPage() {
  const [season, formations, settings] = await Promise.all([
    prisma.season.findFirst({ where: { isActive: true } }),
    prisma.formation.findMany({ orderBy: { code: "asc" } }),
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!season) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-8"
        style={{ background: "#060b14" }}>
        <p className="text-slate-500">Geen actief seizoen gevonden.</p>
      </div>
    );
  }

  const budget = settings?.budget ?? 1750;
  const deadline = settings?.deadline ? new Date(settings.deadline) : null;
  const isPastDeadline = deadline ? new Date() > deadline : false;

  if (isPastDeadline) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-8"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(14,40,80,0.7) 0%, #060b14 70%)" }}>
        <div className="bg-slate-900 neon-border rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-xl font-bold text-white mb-2">Deadline verstreken</h1>
          <p className="text-slate-500 text-sm mb-6">
            De deadline voor het invullen van teams was{" "}
            {deadline!.toLocaleString("nl-NL")}. Het is niet meer mogelijk om je team aan te passen.
          </p>
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
            Terug naar home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] py-8"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(14,40,80,0.5) 0%, #060b14 60%)" }}>
      <TeamBuilder formations={formations} season={season} budget={budget} />
    </main>
  );
}
