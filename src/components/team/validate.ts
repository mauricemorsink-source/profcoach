import type { Formation, Player } from "./types";

export const CLUB_LABEL: Record<string, string> = {
  ONE:   "Rietmolen 1",
  TWO:   "Rietmolen 2",
  THREE: "Rietmolen 3",
  FOUR:  "Rietmolen 4",
  FIVE:  "Rietmolen 5",
  DAMES: "Rietmolen VR1",
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
  budget = 1750,
  captainEnabled = false,
  captainSlot: number | null = null
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

  // Club-validatie (niet zichtbaar in checklist, wel vereist voor indienen)
  let clubsValid = true;
  for (const club of ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"]) {
    const count = countsByClub[club] ?? 0;
    if (count < 1) { errors.push(`Je hebt minimaal 1 speler uit ${CLUB_LABEL[club]} nodig`); clubsValid = false; }
    if (count > 2) { errors.push(`Maximaal 2 spelers uit ${CLUB_LABEL[club]} (je hebt er ${count})`); clubsValid = false; }
  }

  // Zichtbare regels in checklist
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
  ];

  // Aanvoerder regel
  if (captainEnabled) {
    const captainInFilledSlot = captainSlot !== null && slots[captainSlot] != null;
    rules.push({
      key: "captain",
      label: "Aanvoerder",
      display: captainInFilledSlot ? "Gekozen" : "Niet gekozen",
      met: captainInFilledSlot,
    });
    if (!captainInFilledSlot) errors.push("Kies een aanvoerder");
  }

  if (selectedCount !== 11) errors.push(`Je hebt ${selectedCount} van 11 spelers gekozen`);
  if (totalValue > budget)  errors.push(`Budget overschreden: €${totalValue} / €${budget}`);

  const allValid = rules.every((r) => r.met) && seenIds.size === selectedCount && clubsValid;

  return { errors, rules, allValid, totalValue, selectedCount, countsByPos, countsByClub };
}
