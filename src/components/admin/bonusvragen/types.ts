export type Player = {
  id: string;
  name: string;
  shortName?: string | null;
  position: "GK" | "DEF" | "MID" | "ATT";
  clubTeam: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE" | "DAMES";
  altTeam?: string | null;
  value: number;
};

export type PredConfig = {
  topScorerId: string | null;
  topScorer: { id: string; name: string } | null;
  assistKoningId: string | null;
  assistKoning: { id: string; name: string } | null;
  yellowCardsMin: number | null;
  yellowCardsMax: number | null;
  totalGoalsMin: number | null;
  totalGoalsMax: number | null;
  topScorerPoints: number;
  assistKoningPoints: number;
  yellowCardsPoints: number;
  totalGoalsPoints: number;
  showPointsToParticipants: boolean;
  processed: boolean;
  processedAt: string | null;
};

export type PredPreview = {
  config: PredConfig;
  total: number;
  topScorerCount: number | null;
  assistKoningCount: number | null;
  yellowCardsCount: number | null;
  totalGoalsCount: number | null;
};
