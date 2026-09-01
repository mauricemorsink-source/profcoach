import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getContentMap } from "@/lib/content";
import { computeDeelnemersStandings, type DeelnemerStanding } from "@/lib/standings";
import DeelnemersTable from "@/components/tussenstand/DeelnemersTable";
import StandingsPublishPanel from "@/components/tussenstand/StandingsPublishPanel";

export default async function DeelnemersPage() {
  const [session, settings] = await Promise.all([
    getSession(),
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const isAdmin = session?.role === "ADMIN";

  if (!isAdmin && settings?.showTussenstand === false) {
    const content = await getContentMap(["tussenstand.hidden_message", "meldingen.whatsapp_follow"]);
    return (
      <div className="bg-slate-900 neon-border rounded-2xl p-8 text-center">
        <p className="text-slate-300 font-medium">{content["tussenstand.hidden_message"]}</p>
        <p className="text-slate-500 text-sm mt-2">{content["meldingen.whatsapp_follow"]}</p>
      </div>
    );
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });

  // Admin ziet altijd de live stand (om te beoordelen vóór publiceren). Deelnemers zien
  // uitsluitend de meest recente publicatie waarvan revealAt al bereikt is — nooit live data,
  // zodat wij zelf bepalen wanneer (en of) een nieuwe stand zichtbaar wordt.
  let deelnemers: DeelnemerStanding[] = [];
  let visiblePublication: { revealAt: Date } | null = null;

  if (season) {
    if (isAdmin) {
      deelnemers = await computeDeelnemersStandings(season.id);
    } else {
      const publication = await prisma.standingsPublication.findFirst({
        where: { seasonId: season.id, revealAt: { lte: new Date() } },
        orderBy: { revealAt: "desc" },
      });
      if (publication) {
        deelnemers = publication.data as DeelnemerStanding[];
        visiblePublication = publication;
      }
    }
  }

  return (
    <div className="space-y-3">
      {isAdmin && season && <StandingsPublishPanel liveStandings={deelnemers} />}
      {!isAdmin && visiblePublication === null ? (
        <div className="bg-slate-900 neon-border rounded-2xl p-8 text-center">
          <p className="text-slate-300 font-medium">De tussenstand is nog niet gepubliceerd.</p>
        </div>
      ) : (
        <>
          {!isAdmin && visiblePublication && (
            <p className="text-slate-500 text-xs">
              {`Gepubliceerd op ${new Date(visiblePublication.revealAt).toLocaleString("nl-NL", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam",
              })}`}
            </p>
          )}
          <DeelnemersTable deelnemers={deelnemers} />
        </>
      )}
    </div>
  );
}
