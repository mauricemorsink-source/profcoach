import type { PredictionConfig, TeamPrediction } from "@prisma/client";

/**
 * Berekent de bonuspunten die één voorspelling verdient tegen de (op dat moment
 * ingestelde) bonusconfiguratie. Gedeeld door /api/admin/prediction-config/process
 * (toekennen) en /api/admin/prediction-config/retract (intrekken), zodat intrekken
 * precies hetzelfde bedrag terugdraait dat ooit is toegekend — in plaats van
 * bonusPoints blind op 0 te zetten, wat ook los daarvan handmatig ingestelde
 * bonuspunten (via de deelnemers-/team-entry-beheerpagina) zou wissen.
 */
export function calculatePredictionBonus(
  config: PredictionConfig,
  pred: Pick<TeamPrediction, "topScorerId" | "assistKoningId" | "totalYellowCards" | "totalGoals">
): number {
  let bonus = 0;
  if (config.topScorerId && pred.topScorerId === config.topScorerId) bonus += config.topScorerPoints;
  if (config.assistKoningId && pred.assistKoningId === config.assistKoningId) bonus += config.assistKoningPoints;
  if (
    pred.totalYellowCards != null &&
    config.yellowCardsMin != null &&
    config.yellowCardsMax != null &&
    pred.totalYellowCards >= config.yellowCardsMin &&
    pred.totalYellowCards <= config.yellowCardsMax
  ) {
    bonus += config.yellowCardsPoints;
  }
  if (
    pred.totalGoals != null &&
    config.totalGoalsMin != null &&
    config.totalGoalsMax != null &&
    pred.totalGoals >= config.totalGoalsMin &&
    pred.totalGoals <= config.totalGoalsMax
  ) {
    bonus += config.totalGoalsPoints;
  }
  return bonus;
}
