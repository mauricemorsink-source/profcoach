import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getContentMap } from "@/lib/content";
import TeamBuilder from "@/components/team/TeamBuilder";
import RegistrationClosedNotice from "@/components/RegistrationClosedNotice";

export default async function PlayPage() {
  const session = await getSession();
  const [season, formations, settings, content] = await Promise.all([
    prisma.season.findFirst({ where: { isActive: true } }),
    prisma.formation.findMany({ orderBy: { code: "asc" } }),
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
    getContentMap(["meldingen.registratie_gesloten_titel", "meldingen.registratie_gesloten_tekst"]),
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
  const registrationClosed = !(settings?.registrationOpen ?? false) || isPastDeadline;

  const existingTeam = session
    ? await prisma.teamEntry.findFirst({ where: { userId: session.userId, seasonId: season.id } })
    : null;

  // Ingelogde admins/managers zonder eigen team horen hier niet — anders wordt er bij het
  // laden van TeamBuilder automatisch een lege conceptteam voor ze aangemaakt.
  if (session && !existingTeam && (session.role !== "USER" || !session.isParticipant)) {
    redirect(session.role === "ADMIN" ? "/admin" : session.role === "MANAGER" ? "/manager" : "/");
  }

  if (!existingTeam && registrationClosed) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-8"
        style={{ background: "#060b14" }}>
        <div className="w-full max-w-sm">
          <RegistrationClosedNotice
            title={content["meldingen.registratie_gesloten_titel"]}
            text={content["meldingen.registratie_gesloten_tekst"]}
          />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] py-8"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(14,40,80,0.5) 0%, #060b14 60%)" }}>
      <TeamBuilder formations={formations} season={season} budget={budget} captainBonusPerWin={captainBonusPerWin} readOnly={isPastDeadline} deadline={deadline} />
    </main>
  );
}
