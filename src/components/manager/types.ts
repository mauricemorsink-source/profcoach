export type Match = {
  id: string;
  name: string;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  matchDate: string;
  goalsScored: number;
  goalsConceded: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  _count: { performances: number };
};

export type PlayerPerf = {
  playerId: string;
  playerName: string;
  position: string;
  clubTeam?: string;
  altTeam?: string | null;
  isGuest?: boolean;
  played: boolean;
  goals: number;
  penaltyGoals: number;
  assists: number;
  ownGoals: number;
  yellowCards: number;
  redCard: boolean;
};

export type MatchDetail = {
  match: Match;
  players: { id: string; name: string; position: string }[];
  performances: PlayerPerf[];
};

export type AllPlayer = { id: string; name: string; position: string; clubTeam: string; altTeam?: string | null };
