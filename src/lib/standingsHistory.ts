import { prisma } from "@/lib/prisma";
import type { DeelnemerStanding, PublishedStandingsData } from "@/lib/standings";

export type HistoryPoint = { revealAt: Date; points: number; rank: number };

export type ParticipantHistory = {
  id: string;
  userName: string;
  current: HistoryPoint;
  /** Null zolang de deelnemer nog nergens punten heeft; bij 0 punten staan iedereen gelijk op 1. */
  best: HistoryPoint | null;
  points: HistoryPoint[];
};

/**
 * Puntenverloop per deelnemer, afgeleid van alle zichtbare publicaties van de stand. Elke publicatie
 * bevat de volledige ranglijst, dus punten en positie per moment liggen al vast. Alleen deelnemers
 * uit de laatste publicatie krijgen een entry; hun historie komt uit alle publicaties waarin ze staan.
 */
export async function getStandingsHistory(seasonId: string): Promise<ParticipantHistory[]> {
  const publications = await prisma.standingsPublication.findMany({
    where: { seasonId, revealAt: { lte: new Date() } },
    orderBy: { revealAt: "asc" },
    select: { revealAt: true, data: true },
  });

  const historyById = new Map<string, { userName: string; points: HistoryPoint[] }>();
  let latest: DeelnemerStanding[] = [];

  for (const pub of publications) {
    const deelnemers = (pub.data as PublishedStandingsData).deelnemers ?? [];
    if (deelnemers.length === 0) continue;
    latest = deelnemers;

    // Gedeelde punten krijgen dezelfde positie (1, 1, 3 ...).
    for (const d of deelnemers) {
      const rank = 1 + deelnemers.filter((o) => o.totalPoints > d.totalPoints).length;
      const entry = historyById.get(d.id) ?? { userName: d.userName, points: [] };
      entry.userName = d.userName;
      entry.points.push({ revealAt: pub.revealAt, points: d.totalPoints, rank });
      historyById.set(d.id, entry);
    }
  }

  return latest.flatMap((d) => {
    const entry = historyById.get(d.id);
    if (!entry || entry.points.length === 0) return [];
    // Momenten met 0 punten tellen niet mee: daar staat iedereen gelijk op 1 en zegt de positie niets.
    // reduce met strikte < houdt bij gelijke positie de eerste (vroegste) keer.
    const scored = entry.points.filter((p) => p.points > 0);
    const best = scored.length ? scored.reduce((a, b) => (b.rank < a.rank ? b : a)) : null;
    return [{
      id: d.id,
      userName: entry.userName,
      current: entry.points[entry.points.length - 1],
      best,
      points: entry.points,
    }];
  });
}
