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
  /** Spelers met evenveel punten als de laatst gekozen speler van hun positie, maar die er niet meer bij pasten. */
  tiedOut?: TotWPlayer[];
  total?: number;
  recommendedCode?: string | null;
};

export type FormationAdvice = Formation & {
  total: number;
  /** Alle 11 plekken kunnen met een speler gevuld worden. */
  complete: boolean;
  /** Aantal gelijkgeplaatste spelers dat in deze formatie buiten de boot valt. */
  tiedOut: number;
};
