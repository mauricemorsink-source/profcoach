import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getContentMap } from "@/lib/content";
import { computeDeelnemersStandings, type DeelnemerStanding } from "@/lib/standings";
import DeelnemersTable from "@/components/tussenstand/DeelnemersTable";
import PublishStandingsBar from "@/components/tussenstand/PublishStandingsBar";

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

  const publishedStandingsAt = settings?.publishedStandingsAt ?? null;
  const publishedStandingsData = (settings?.publishedStandingsData as DeelnemerStanding[] | null) ?? null;

  // Admin ziet altijd de live stand (om te beoordelen vóór publiceren). Deelnemers zien
  // uitsluitend de laatst gepubliceerde momentopname — nooit automatisch live data, zodat
  // wij zelf bepalen wanneer een nieuwe stand zichtbaar wordt.
  let deelnemers: DeelnemerStanding[] = [];
  if (isAdmin) {
    const season = await prisma.season.findFirst({ where: { isActive: true } });
    if (season) deelnemers = await computeDeelnemersStandings(season.id);
  } else {
    deelnemers = publishedStandingsData ?? [];
  }

  const publishedLabel = publishedStandingsAt
    ? new Date(publishedStandingsAt).toLocaleString("nl-NL", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam",
      })
    : null;

  return (
    <div className="space-y-3">
      {isAdmin && <PublishStandingsBar publishedStandingsAt={publishedStandingsAt} />}
      {!isAdmin && publishedStandingsData === null ? (
        <div className="bg-slate-900 neon-border rounded-2xl p-8 text-center">
          <p className="text-slate-300 font-medium">De tussenstand is nog niet gepubliceerd.</p>
        </div>
      ) : (
        <>
          {!isAdmin && (
            <p className="text-slate-500 text-xs">{`Gepubliceerd op ${publishedLabel}`}</p>
          )}
          <DeelnemersTable deelnemers={deelnemers} />
        </>
      )}
    </div>
  );
}
