import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getContentMap } from "@/lib/content";
import { getStandingsHistory } from "@/lib/standingsHistory";
import PuntenGrafiek from "@/components/tussenstand/PuntenGrafiek";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" });

export default async function DeelnemerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  if (!season) notFound();

  const history = await getStandingsHistory(season.id);
  const participant = history.find((h) => h.id === id);
  if (!participant) notFound();

  return (
    <div className="bg-slate-900 neon-border rounded-2xl p-5 space-y-5">
      <Link
        href="/tussenstand/deelnemers"
        className="block w-full text-center text-sm font-semibold text-slate-300 hover:text-cyan-400 bg-slate-800/60 border border-slate-700 rounded-lg py-2 transition-colors"
      >
        ← Terug naar de stand
      </Link>

      <div className="space-y-5">
        <h2 className="text-xl font-black text-white">{participant.userName}</h2>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Positie</p>
            <p className="text-2xl font-black text-white">{participant.current.rank}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Punten</p>
            <p className="text-2xl font-black text-cyan-400">{participant.current.points}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Hoogste positie</p>
            <p className="text-2xl font-black text-amber-400">{participant.best?.rank ?? "—"}</p>
            {participant.best && (
              <p className="text-[11px] text-slate-500 mt-0.5">op {fmtDate(participant.best.revealAt)}</p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Punten over tijd</p>
          <PuntenGrafiek
            series={[{
              label: participant.userName,
              highlight: true,
              points: participant.points.map((p) => ({ t: p.revealAt.getTime(), y: p.points, rank: p.rank })),
            }]}
          />
          {participant.points.length < 2 && (
            <p className="text-slate-500 text-xs mt-2">Er is nog maar één publicatie; de grafiek wordt interessanter na meer publicaties.</p>
          )}
        </div>
      </div>
    </div>
  );
}
