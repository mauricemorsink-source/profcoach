import type { PredictionConfig, TeamPrediction } from "@prisma/client";

export type PredictionBonusBreakdown = {
  topScorer: number;
  assistKoning: number;
  yellowCards: number;
  totalGoals: number;
};

/**
 * Berekent per bonusvraag (topscorer, assistkoning, gele kaarten, doelpunten) hoeveel
 * punten die vraag heeft opgeleverd tegen de (op dat moment ingestelde) configuratie.
 * Basis voor zowel het totaal (calculatePredictionBonus) als het overzicht per antwoord
 * in het admin-deelnemersscherm.
 */
export function calculatePredictionBonusBreakdown(
  config: PredictionConfig,
  pred: Pick<TeamPrediction, "topScorerId" | "assistKoningId" | "totalYellowCards" | "totalGoals">
): PredictionBonusBreakdown {
  const topScorer = config.topScorerId && pred.topScorerId === config.topScorerId ? config.topScorerPoints : 0;
  const assistKoning =
    config.assistKoningId && pred.assistKoningId === config.assistKoningId ? config.assistKoningPoints : 0;
  const yellowCards =
    pred.totalYellowCards != null &&
    config.yellowCardsMin != null &&
    config.yellowCardsMax != null &&
    pred.totalYellowCards >= config.yellowCardsMin &&
    pred.totalYellowCards <= config.yellowCardsMax
      ? config.yellowCardsPoints
      : 0;
  const totalGoals =
    pred.totalGoals != null &&
    config.totalGoalsMin != null &&
    config.totalGoalsMax != null &&
    pred.totalGoals >= config.totalGoalsMin &&
    pred.totalGoals <= config.totalGoalsMax
      ? config.totalGoalsPoints
      : 0;
  return { topScorer, assistKoning, yellowCards, totalGoals };
}

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
  const b = calculatePredictionBonusBreakdown(config, pred);
  return b.topScorer + b.assistKoning + b.yellowCards + b.totalGoals;
}
