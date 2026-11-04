import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getContentMap } from "@/lib/content";
import { getVisibleStandingsPublication, type PublishedStandingsData } from "@/lib/standings";
import DeelnemersTable from "@/components/tussenstand/DeelnemersTable";

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

  // Iedereen (ook admin) ziet hier uitsluitend de meest recente publicatie — nooit live data.
  // De live stand + het publiceren/terugdraaien zit in het admin-tabje Tussenstand
  // (/admin/tussenstand), niet hier op de publieke pagina.
  const publication = season ? await getVisibleStandingsPublication(season.id) : null;
  const data = publication?.data as PublishedStandingsData | undefined;

  return (
    <div className="space-y-3">
      {!publication ? (
        <div className="bg-slate-900 neon-border rounded-2xl p-8 text-center">
          <p className="text-slate-300 font-medium">De tussenstand is nog niet gepubliceerd.</p>
        </div>
      ) : (
        <>
          <p className="text-slate-500 text-xs">
            {`Laatste wijziging: ${new Date(publication.revealAt).toLocaleDateString("nl-NL", {
              day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam",
            })}`}
          </p>
          <DeelnemersTable deelnemers={data?.deelnemers ?? []} />
        </>
      )}
    </div>
  );
}
