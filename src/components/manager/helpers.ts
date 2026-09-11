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
