export type FlexConflict = {
  playerId: string;
  player: { name: string; position: string; clubTeam: string; altTeam: string | null };
  matches: {
    matchId: string;
    matchName: string;
    matchDate: string;
    matchClubTeam: string;
    isOriginalTeam: boolean;
    goals: number;
    penaltyGoals: number;
    assists: number;
    ownGoals: number;
    yellowCards: number;
    redCard: boolean;
    points: number;
  }[];
};

export type GuestAppearance = {
  playerId: string;
  playerName: string;
  playerPosition: string;
  day: string;
  ambiguous: boolean;
  matches: {
    matchId: string;
    matchName: string;
    matchClubTeam: string;
    isOwnTeam: boolean;
    counts: boolean;
    points: number;
  }[];
};

export type PublishMoment = {
  id: string;
  label: string;
  scheduledAt: string;
  publishedAt: string | null;
  matches: { id: string; status: string }[];
};

export type AdminMatch = {
  id: string;
  name: string;
  clubTeam: string;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  matchDate: string;
  goalsScored: number;
  goalsConceded: number;
  extraScorers: { goals: number; description: string }[] | null;
  notes: string | null;
  submittedByName: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  publishMomentId: string | null;
  publishMoment: { id: string; label: string; scheduledAt: string; publishedAt: string | null } | null;
  createdBy: { name: string | null; email: string } | null;
  performances: {
    playerId: string;
    played: boolean;
    goals: number;
    penaltyGoals: number;
    assists: number;
    ownGoals: number;
    yellowCards: number;
    redCard: boolean;
    player: { name: string; position: string; clubTeam: string; altTeam: string | null };
  }[];
};

export type EditPerfEntry = {
  played: boolean;
  goals: number;
  penaltyGoals: number;
  assists: number;
  ownGoals: number;
  yellowCards: number;
  redCard: boolean;
};
