export type Match = {
  id: string;
  name: string;
  matchDate: string;
  clubTeam: string;
  publishMoment: { label: string } | null;
};

export type Formation = {
  code: string;
  defenders: number;
  midfielders: number;
  attackers: number;
};

export type TotWPlayer = {
  playerId: string;
  name: string;
  shortName: string | null;
  position: string;
  clubTeam: string;
  points: number;
};

export type TotWResult = {
  formation: Formation;
  players: TotWPlayer[];
};
