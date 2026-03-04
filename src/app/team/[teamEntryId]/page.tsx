import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Pitch from "@/components/team/Pitch";
import { buildSlots } from "@/components/team/formationSlots";
import type { Player } from "@/components/team/types";

const CLUB_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

export default async function ShareTeamPage({
  params,
}: {
  params: Promise<{ teamEntryId: string }>;
}) {
  const { teamEntryId } = await params;

  const team = await prisma.teamEntry.findUnique({
    where: { id: teamEntryId },
    include: {
      formation: true,
      user: { select: { name: true, email: true } },
      players: {
        include: {
          player: { select: { id: true, name: true, shortName: true, position: true, clubTeam: true, value: true, active: true } },
        },
        orderBy: { slotIndex: "asc" },
      },
    },
  });

  if (!team) notFound();

  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  const captainEnabled = settings?.captainEnabled ?? false;

  const slots = buildSlots(team.formation);
  const slotValues: (string | null)[] = Array(11).fill(null);
  const playersById: Record<string, Player> = {};

  for (const tp of team.players) {
    slotValues[tp.slotIndex] = tp.player.id;
    playersById[tp.player.id] = tp.player as Player;
  }

  const totalValue = team.players.reduce((sum, tp) => sum + tp.player.value, 0);
  const userName = team.user?.name ?? team.user?.email ?? "Anoniem";

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(14,40,80,0.6) 0%, #060b14 70%)" }}
    >
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-5">
          <Link href="/" className="text-slate-500 hover:text-white text-sm transition-colors">
            ← ProfCoach
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-white">{userName}</h1>
              <p className="text-slate-400 text-sm">{team.formation.code} · €{totalValue}</p>
            </div>
            {captainEnabled && team.captainSlot !== null && team.captainSlot !== undefined && (
              <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold">
                Aanvoerder actief
              </div>
            )}
          </div>
        </div>

        {/* Pitch (read-only) */}
        <Pitch
          slots={slots}
          selectedSlot={null}
          playersById={playersById}
          slotValues={slotValues}
          onSlotClick={() => {}}
          locked={true}
          captainSlot={captainEnabled ? (team.captainSlot ?? null) : null}
        />

        {/* Spelerlijst */}
        <div className="mt-5 bg-slate-900 neon-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-2.5 font-semibold">Speler</th>
                <th className="px-4 py-2.5 font-semibold">Elftal</th>
                <th className="px-4 py-2.5 font-semibold text-right">€</th>
              </tr>
            </thead>
            <tbody>
              {team.players.map((tp) => {
                const isCaptain = captainEnabled && team.captainSlot === tp.slotIndex;
                return (
                  <tr key={tp.slotIndex} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-medium text-white">
                      {tp.player.name}
                      {isCaptain && (
                        <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">C</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">{CLUB_LABEL[tp.player.clubTeam] ?? tp.player.clubTeam}</td>
                    <td className="px-4 py-2.5 text-right text-cyan-400 font-bold">{tp.player.value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="mt-5">
          <Link
            href="/register"
            className="block w-full text-center py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors neon-glow-sm"
          >
            Maak jouw eigen team
          </Link>
        </div>
      </div>
    </div>
  );
}
