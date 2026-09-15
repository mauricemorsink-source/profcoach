export type Player = {
  id: string;
  name: string;
  shortName?: string | null;
  position: "GK" | "DEF" | "MID" | "ATT";
  clubTeam: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE" | "DAMES";
  altTeam?: string | null;
  value: number;
  hasPlayedMatch: boolean;
  totalPoints: number;
  pickCount: number;
};

export type PlayerForm = {
  name: string;
  shortName: string;
  position: string;
  clubTeam: string;
  altTeam: string;
  value: string;
};

export type ImportResult = {
  imported: number;
  alreadyPresent: number;
  skipped: number;
  errors: string[];
};

export type PlayerStatPerf = {
  matchId: string;
  matchName: string;
  matchDate: string;
  clubTeam: string;
  homeAway: string;
  goalsScored: number;
  goalsConceded: number;
  played: boolean;
  isExcluded: boolean;
  goals: number;
  penaltyGoals: number;
  assists: number;
  ownGoals: number;
  yellowCards: number;
  redCard: boolean;
  cleanSheet: boolean;
  won: boolean;
  drew: boolean;
  points: number;
  breakdown: Record<string, number>;
};

export type PlayerStats = {
  player: Player;
  seasonStats: {
    totalPoints: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    cleanSheets: number;
    wins: number;
    draws: number;
    matchesPlayed: number;
  } | null;
  performances: PlayerStatPerf[];
  pickedBy: { teamEntryId: string; naam: string | null; locked: boolean; isCaptain: boolean }[];
};
