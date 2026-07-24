import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import TeamBuilder from "@/components/team/TeamBuilder";

export default async function MijnTeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");
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
  const captainBonusPerWin = settings?.captainBonusPerWin ?? 5;
  const deadline = settings?.deadline ? new Date(settings.deadline) : null;
  const isPastDeadline = deadline ? new Date() > deadline : false;

  return (
    <main className="min-h-[calc(100vh-56px)] py-8"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(14,40,80,0.5) 0%, #060b14 60%)" }}>
      <TeamBuilder formations={formations} season={season} budget={budget} captainBonusPerWin={captainBonusPerWin} readOnly={isPastDeadline} deadline={deadline} />
    </main>
  );
}
