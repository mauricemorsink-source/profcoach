import type { Formation, Player } from "./types";

export const CLUB_LABEL: Record<string, string> = {
  ONE:   "Rietmolen 1",
  TWO:   "Rietmolen 2",
  THREE: "Rietmolen 3",
  FOUR:  "Rietmolen 4",
  FIVE:  "Rietmolen 5",
  DAMES: "Rietmolen Dames",
};

export interface ValidationRule {
  key: string;
  label: string;
  display: string;   // bijv. "2/11", "€1200 / €1750"
  met: boolean;
}

export interface ValidationResult {
  errors: string[];
  rules: ValidationRule[];
  allValid: boolean;
  totalValue: number;
  selectedCount: number;
  countsByPos: Record<string, number>;
  countsByClub: Record<string, number>;
}

export function validateTeam(
  slots: (string | null)[],
  playersById: Record<string, Player>,
  formation: Formation,
  budget = 1750
): ValidationResult {
  const errors: string[] = [];
  const countsByPos: Record<string, number> = {};
  const countsByClub: Record<string, number> = {};
  let totalValue = 0;
  let selectedCount = 0;
  const seenIds = new Set<string>();

  for (const playerId of slots) {
    if (!playerId) continue;
    const player = playersById[playerId];
    if (!player) continue;

    selectedCount++;
    totalValue += player.value;

    if (seenIds.has(playerId)) {
      errors.push(`Speler ${player.name} staat twee keer in je team`);
    }
    seenIds.add(playerId);

    countsByPos[player.position] = (countsByPos[player.position] ?? 0) + 1;
    countsByClub[player.clubTeam] = (countsByClub[player.clubTeam] ?? 0) + 1;
  }

  const gkCount  = countsByPos["GK"]  ?? 0;
  const defCount = countsByPos["DEF"] ?? 0;
  const midCount = countsByPos["MID"] ?? 0;
  const attCount = countsByPos["ATT"] ?? 0;

  // Opbouwen gestructureerde regels
  const rules: ValidationRule[] = [
    {
      key:     "spelers",
      label:   "Spelers geselecteerd",
      display: `${selectedCount}/11`,
      met:     selectedCount === 11,
    },
    {
      key:     "budget",
      label:   "Budget",
      display: `€${totalValue} / €${budget}`,
      met:     totalValue <= budget,
    },
    {
      key:     "gk",
      label:   "Keeper",
      display: `${gkCount}/1`,
      met:     gkCount === 1,
    },
    {
      key:     "def",
      label:   "Verdedigers",
      display: `${defCount}/${formation.defenders}`,
      met:     defCount === formation.defenders,
    },
    {
      key:     "mid",
      label:   "Middenvelders",
      display: `${midCount}/${formation.midfielders}`,
      met:     midCount === formation.midfielders,
    },
    {
      key:     "att",
      label:   "Aanvallers",
      display: `${attCount}/${formation.attackers}`,
      met:     attCount === formation.attackers,
    },
    ...["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"].map((club) => {
      const count = countsByClub[club] ?? 0;
      const clubMet = count >= 1 && count <= 2;
      if (!clubMet) {
        if (count < 1) errors.push(`Je hebt minimaal 1 speler uit ${CLUB_LABEL[club]} nodig`);
        if (count > 2) errors.push(`Maximaal 2 spelers uit ${CLUB_LABEL[club]} (je hebt er ${count})`);
      }
      return {
        key:     `club_${club}`,
        label:   CLUB_LABEL[club],
        display: `${count}/2`,
        met:     clubMet,
      };
    }),
  ];

  // Positie-fouten (niet al gedekt via club-loop)
  if (selectedCount !== 11) errors.push(`Je hebt ${selectedCount} van 11 spelers gekozen`);
  if (totalValue > budget)  errors.push(`Budget overschreden: €${totalValue} / €${budget}`);
  if (gkCount !== 1)        errors.push("Je hebt exact 1 keeper nodig");
  if (defCount !== formation.defenders) errors.push(`Je hebt ${formation.defenders} verdedigers nodig`);
  if (midCount !== formation.midfielders) errors.push(`Je hebt ${formation.midfielders} middenvelders nodig`);
  if (attCount !== formation.attackers) errors.push(`Je hebt ${formation.attackers} aanvallers nodig`);

  // Max 2 per club (al in rules, maar ook fout-melding)
  for (const [club, count] of Object.entries(countsByClub)) {
    if (count > 2) errors.push(`Maximaal 2 spelers uit ${CLUB_LABEL[club] ?? club}`);
  }

  const allValid = rules.every((r) => r.met) && seenIds.size === selectedCount;

  return { errors, rules, allValid, totalValue, selectedCount, countsByPos, countsByClub };
}
