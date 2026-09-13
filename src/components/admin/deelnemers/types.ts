export type TeamPlayer = {
  slotIndex: number;
  totalPoints: number;
  player: { id: string; name: string; position: string; clubTeam: string };
};

export type Prediction = {
  topScorer: { id: string; name: string } | null;
  assistKoning: { id: string; name: string } | null;
  totalYellowCards: number | null;
  totalGoals: number | null;
};

export type PredictionBonusBreakdown = {
  topScorer: number;
  assistKoning: number;
  yellowCards: number;
  totalGoals: number;
};

export type Deelnemer = {
  id: string;
  voornaam: string | null;
  achternaam: string | null;
  email: string | null;
  telefoonnummer: string | null;
  whatsappGroep: boolean;
  whatsappToegevoegd: boolean;
  betaaldAkkoord: boolean;
  betaald: boolean;
  bonusPoints: number;
  captainPoints: number;
  captainSlot: number | null;
  createdAt: string;
  formation: { id: string; code: string } | null;
  players: TeamPlayer[];
  prediction: Prediction | null;
  predictionBonusBreakdown: PredictionBonusBreakdown | null;
};
