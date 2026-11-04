import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getContentMap } from "@/lib/content";
import { getStandingsHistory } from "@/lib/standingsHistory";
import PuntenGrafiek from "@/components/tussenstand/PuntenGrafiek";
import VergelijkKiezer from "@/components/tussenstand/VergelijkKiezer";

const MAX_COMPARE = 4;

export default async function VergelijkenPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams;
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
  const history = season ? await getStandingsHistory(season.id) : [];

  // Volgorde uit de URL bepaalt de volgorde in de grafiek; alleen bestaande deelnemers, maximaal MAX_COMPARE.
  const selected = (ids ?? "")
    .split(",")
    .map((id) => history.find((h) => h.id === id))
    .filter((h): h is (typeof history)[number] => !!h)
    .filter((h, i, arr) => arr.indexOf(h) === i)
    .slice(0, MAX_COMPARE);

  return (
    <div className="bg-slate-900 neon-border rounded-2xl p-5 space-y-5">
      <Link
        href="/tussenstand/deelnemers"
        className="block w-full text-center text-sm font-semibold text-slate-300 hover:text-cyan-400 bg-slate-800/60 border border-slate-700 rounded-lg py-2 transition-colors"
      >
        ← Terug naar de stand
      </Link>

      <div>
        <h2 className="text-lg font-bold text-white">Vergelijk deelnemers</h2>
        <p className="text-slate-500 text-sm">Zoek een deelnemer om toe te voegen (maximaal {MAX_COMPARE}). De eerste staat er vet in.</p>
      </div>

      <VergelijkKiezer
        deelnemers={history.map((h) => ({ id: h.id, userName: h.userName }))}
        selected={selected.map((h) => ({ id: h.id, userName: h.userName }))}
      />

      {selected.length === 0 ? (
        <p className="text-slate-500 text-sm">Nog niemand gekozen.</p>
      ) : (
        <>
          <PuntenGrafiek
            series={selected.map((h, i) => ({
              label: h.userName,
              highlight: i === 0,
              points: h.points.map((p) => ({ t: p.revealAt.getTime(), y: p.points, rank: p.rank })),
            }))}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800">
                  <th className="py-2 pr-3 font-semibold">Deelnemer</th>
                  <th className="py-2 pr-3 font-semibold text-right">Positie</th>
                  <th className="py-2 pr-3 font-semibold text-right">Punten</th>
                  <th className="py-2 font-semibold text-right">Hoogste positie</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((h) => (
                  <tr key={h.id} className="border-b border-slate-800/60">
                    <td className="py-2 pr-3 font-semibold text-white">{h.userName}</td>
                    <td className="py-2 pr-3 text-right text-slate-300">{h.current.rank}</td>
                    <td className="py-2 pr-3 text-right font-bold text-cyan-400">{h.current.points}</td>
                    <td className="py-2 text-right text-amber-400">{h.best?.rank ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
