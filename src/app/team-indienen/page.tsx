import { prisma } from "@/lib/prisma";
import { getContentMap } from "@/lib/content";
import KladopstellingClient from "@/components/kladopstelling/KladopstellingClient";

export default async function TeamIndienen() {
  const [formations, settings, content] = await Promise.all([
    prisma.formation.findMany({ orderBy: { code: "asc" } }),
    prisma.gameSettings.findUnique({ where: { id: "singleton" } }),
    getContentMap(["meldingen.registratie_gesloten_titel", "meldingen.registratie_gesloten_tekst"]),
  ]);

  return (
    <KladopstellingClient
      formations={formations}
      budget={settings?.budget ?? 1750}
      requireLogin={settings?.requireLogin ?? true}
      inschrijfgeld={settings?.inschrijfgeld ?? 0}
      registrationOpen={settings?.registrationOpen ?? false}
      deadline={settings?.deadline?.toISOString() ?? null}
      captainEnabled={settings?.captainEnabled ?? false}
      captainBonusPerWin={settings?.captainBonusPerWin ?? 5}
      registrationClosedTitle={content["meldingen.registratie_gesloten_titel"]}
      registrationClosedText={content["meldingen.registratie_gesloten_tekst"]}
    />
  );
}
