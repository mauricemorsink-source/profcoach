export type PerformanceInput = {
  playerId: string;
  played: boolean;
  goals?: number | null;
  penaltyGoals?: number | null;
  assists?: number | null;
  ownGoals?: number | null;
  yellowCards?: number | null;
  redCard: boolean;
};

/**
 * goals/assists/kaarten worden rechtstreeks in de puntenberekening vermenigvuldigd met de
 * (soms negatieve) puntenwaarden per actie. Zonder deze check zou bv. een negatief aantal
 * gele kaarten (yellowCards: -1) een POSITIEVE bijdrage aan de punten opleveren in plaats
 * van een straf — dus dit is geen cosmetische validatie maar voorkomt een manipuleerbare
 * puntentelling. Een ontbrekend veld (undefined/null) is geldig — de upsert valt dan terug
 * op 0, net zoals nu al gebeurt.
 */
export function validatePerformanceInput(p: PerformanceInput): string | null {
  const fields: [string, number | null | undefined][] = [
    ["Doelpunten", p.goals],
    ["Strafschoppen", p.penaltyGoals],
    ["Assists", p.assists],
    ["Eigen doelpunten", p.ownGoals],
    ["Gele kaarten", p.yellowCards],
  ];
  for (const [label, value] of fields) {
    if (value == null) continue;
    if (!Number.isInteger(value) || value < 0) {
      return `${label} moet een positief geheel getal zijn`;
    }
  }
  if (p.yellowCards != null && p.yellowCards > 2) {
    return "Gele kaarten kan niet meer dan 2 zijn";
  }
  return null;
}
