import type { Formation } from "@/components/team/types";

export interface Props {
  formations: Formation[];
  budget: number;
  requireLogin: boolean;
  inschrijfgeld: number;
  registrationOpen: boolean;
  deadline: string | null;
  captainEnabled: boolean;
  captainBonusPerWin: number;
  registrationClosedTitle?: string;
  registrationClosedText?: string;
}

export interface PredPointsConfig {
  showPointsToParticipants: boolean;
  topScorerPoints: number;
  assistKoningPoints: number;
  yellowCardsPoints: number;
  totalGoalsPoints: number;
}

export interface PersonInfo {
  voornaam: string;
  achternaam: string;
  email: string;
  telefoonnummer: string;
  whatsappGroep: boolean;
}
