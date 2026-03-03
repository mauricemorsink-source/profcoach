import type { Formation, SlotDef } from "./types";

export function buildSlots(formation: Formation): SlotDef[] {
  const slots: SlotDef[] = [];

  // 1 keeper
  slots.push({ slotIndex: 0, position: "GK", label: "GK" });

  // Verdedigers
  for (let i = 0; i < formation.defenders; i++) {
    slots.push({
      slotIndex: slots.length,
      position: "DEF",
      label: `DEF ${i + 1}`,
    });
  }

  // Middenvelders
  for (let i = 0; i < formation.midfielders; i++) {
    slots.push({
      slotIndex: slots.length,
      position: "MID",
      label: `MID ${i + 1}`,
    });
  }

  // Aanvallers
  for (let i = 0; i < formation.attackers; i++) {
    slots.push({
      slotIndex: slots.length,
      position: "ATT",
      label: `AAN ${i + 1}`,
    });
  }

  if (slots.length !== 11) {
    throw new Error(
      `Formatie ${formation.code} levert ${slots.length} slots op, verwacht 11`
    );
  }

  return slots;
}