import { TEAM_LABEL } from "./constants";

export function toCardValue(yellowCards: number, redCard: boolean): string {
  if (yellowCards >= 2 && redCard) return "2y";
  if (yellowCards === 1 && redCard) return "1yr";
  if (redCard) return "r";
  if (yellowCards >= 1) return "1y";
  return "";
}

export function fromCardValue(v: string): { yellowCards: number; redCard: boolean } {
  if (v === "1y")  return { yellowCards: 1, redCard: false };
  if (v === "2y")  return { yellowCards: 2, redCard: true };
  if (v === "r")   return { yellowCards: 0, redCard: true };
  if (v === "1yr") return { yellowCards: 1, redCard: true };
  return { yellowCards: 0, redCard: false };
}

const LINE_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, ATT: 3 };

// Zelfde volgorde als het invulformulier van de manager: keeper, verdedigers, middenvelders,
// aanvallers, en binnen een linie op naam.
export function sortByLine<T extends { player: { name: string; position: string } }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      (LINE_ORDER[a.player.position] ?? 9) - (LINE_ORDER[b.player.position] ?? 9) ||
      a.player.name.localeCompare(b.player.name, "nl")
  );
}

export function getOpponent(name: string, clubTeam: string): string {
  const label = TEAM_LABEL[clubTeam] ?? clubTeam;
  const parts = name.split(" - ");
  return parts.find((p) => p.trim() !== label) ?? name;
}
