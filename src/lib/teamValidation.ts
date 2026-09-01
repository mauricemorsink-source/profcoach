import { prisma } from "@/lib/prisma";
import { validateTeam } from "@/components/team/validate";
import { buildSlots } from "@/components/team/formationSlots";
import type { Player } from "@/components/team/types";

/**
 * Server-side spiegel van de client-side validateTeam (budget, max. 2 spelers per
 * elftal, posities per slot, geen dubbele spelers, alle 11 slots gevuld). De UI
 * controleert dit al voordat iemand op "Indienen" klikt, maar zonder deze check hier
 * ook af te dwingen kon een team met een rechtstreeks API-verzoek (buiten de UI om)
 * gewoon een ongeldige samenstelling indienen — bv. 11x dezelfde speler, alles uit
 * één elftal, of ver over budget.
 */
export async function validateTeamServerSide(params: {
  formationId: string;
  slots: (string | null)[];
  budget: number;
  captainEnabled: boolean;
  captainSlot: number | null;
}): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const { formationId, slots, budget, captainEnabled, captainSlot } = params;

  if (!Array.isArray(slots) || slots.length !== 11) {
    return { ok: false, errors: ["Ongeldige teamsamenstelling"] };
  }

  const formation = await prisma.formation.findUnique({ where: { id: formationId } });
  if (!formation) return { ok: false, errors: ["Ongeldige formatie"] };

  const playerIds = slots.filter((id): id is string => !!id);
  const players = await prisma.player.findMany({ where: { id: { in: playerIds } } });
  const playersById: Record<string, Player> = {};
  for (const p of players) {
    playersById[p.id] = {
      id: p.id,
      name: p.name,
      position: p.position,
      clubTeam: p.clubTeam,
      value: p.value,
      active: p.active,
    };
  }

  for (const id of playerIds) {
    if (!playersById[id]) return { ok: false, errors: ["Eén of meer geselecteerde spelers bestaan niet (meer)"] };
  }

  const slotDefs = buildSlots(formation);
  const result = validateTeam(slots, playersById, formation, budget, captainEnabled, captainSlot, slotDefs);
  if (!result.allValid) return { ok: false, errors: result.errors };
  return { ok: true };
}
