import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TeamAanpassenClient from "@/components/TeamAanpassenClient";

export default async function TeamAanpassenTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const editToken = await prisma.editToken.findUnique({
    where: { token },
    include: {
      teamEntry: {
        include: {
          formation: true,
          players: { include: { player: true }, orderBy: { slotIndex: "asc" } },
        },
      },
    },
  });

  if (
    !editToken ||
    editToken.usedAt ||
    editToken.expiresAt < new Date()
  ) {
    notFound();
  }

  const settings = await prisma.gameSettings.findUnique({
    where: { id: "singleton" },
    select: { wijzigingsvensterOpen: true, budget: true, captainEnabled: true, captainBonusPerWin: true },
  });

  if (!settings?.wijzigingsvensterOpen) {
    notFound();
  }

  const formations = await prisma.formation.findMany({ orderBy: { code: "asc" } });

  const existingSlots: (string | null)[] = Array(11).fill(null);
  for (const p of editToken.teamEntry.players) {
    existingSlots[p.slotIndex] = p.playerId;
  }

  const existingPlayers = Object.fromEntries(
    editToken.teamEntry.players.map((p) => [
      p.playerId,
      {
        id: p.player.id,
        name: p.player.name,
        position: p.player.position,
        clubTeam: p.player.clubTeam,
        value: p.player.value,
        active: p.player.active,
      },
    ])
  );

  return (
    <TeamAanpassenClient
      token={token}
      formations={formations}
      budget={settings.budget}
      captainEnabled={settings.captainEnabled}
      captainBonusPerWin={settings.captainBonusPerWin}
      initialFormationId={editToken.teamEntry.formationId}
      initialSlots={existingSlots}
      initialCaptainSlot={editToken.teamEntry.captainSlot ?? null}
      initialPlayers={existingPlayers}
      naam={editToken.teamEntry.voornaam ?? ""}
    />
  );
}
