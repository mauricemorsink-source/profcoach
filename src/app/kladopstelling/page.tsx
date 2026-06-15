import { prisma } from "@/lib/prisma";
import KladopstellingClient from "@/components/kladopstelling/KladopstellingClient";

export default async function KladopstellingPage() {
  const [formations, settings] = await Promise.all([
    prisma.formation.findMany({ orderBy: { code: "asc" } }),
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <KladopstellingClient
      formations={formations}
      budget={settings?.budget ?? 1750}
      requireLogin={settings?.requireLogin ?? true}
      inschrijfgeld={settings?.inschrijfgeld ?? 0}
      registrationOpen={settings?.registrationOpen ?? false}
      captainEnabled={settings?.captainEnabled ?? false}
      captainBonusPerWin={settings?.captainBonusPerWin ?? 5}
    />
  );
}
