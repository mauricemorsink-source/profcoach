export type Position = "GK" | "DEF" | "MID" | "ATT";
export type ClubTeamCode = "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE" | "DAMES";

export interface Player {
  id: string;
  name: string;
  shortName?: string | null;
  position: Position;
  clubTeam: ClubTeamCode;
  value: number;
  active: boolean;
}

export interface Formation {
  id: string;
  code: string;
  defenders: number;
  midfielders: number;
  attackers: number;
}

export interface Season {
  id: string;
  name: string;
  isActive: boolean;
}

export interface SlotDef {
  slotIndex: number;
  position: Position;
  label: string;
}

export interface TeamEntryPlayer {
  id: string;
  teamEntryId: string;
  playerId: string;
  slotIndex: number;
  player: Player;
}

export interface TeamEntry {
  id: string;
  seasonId: string;
  formationId: string;
  locked: boolean;
  createdAt: string;
  formation: Formation;
  players: TeamEntryPlayer[];
}