export type PlayerEntry = {
  playerId: string;
  name: string;
  shortName: string | null;
  position: string;
  clubTeam: string;
  points: number;
};

export type FormationDef = {
  code: string;
  defenders: number;
  midfielders: number;
  attackers: number;
};

export type ByPosition = Record<"GK" | "DEF" | "MID" | "ATT", PlayerEntry[]>;

export type FormationEvaluation = FormationDef & {
  picked: PlayerEntry[];
  /** Spelers met evenveel punten als de laatst gekozen speler van hun positie, maar die er niet meer bij pasten. */
  tiedOut: PlayerEntry[];
  total: number;
  /** Alle 11 plekken zijn met een speler gevuld. */
  complete: boolean;
};

// Deterministisch: punten aflopend, bij gelijke stand op naam. Willekeurig loten (zoals eerst)
// gaf bij elke generatie een ander elftal.
function sortPlayers(list: PlayerEntry[]): PlayerEntry[] {
  return [...list].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "nl"));
}

export function pickTopN(list: PlayerEntry[], n: number): { picked: PlayerEntry[]; tiedOut: PlayerEntry[] } {
  const sorted = sortPlayers(list);
  if (n <= 0) return { picked: [], tiedOut: [] };
  if (sorted.length <= n) return { picked: sorted, tiedOut: [] };
  const picked = sorted.slice(0, n);
  const cutoff = sorted[n - 1].points;
  return { picked, tiedOut: sorted.slice(n).filter((p) => p.points === cutoff) };
}

export function evaluateFormation(byPos: ByPosition, f: FormationDef): FormationEvaluation {
  const parts = [
    pickTopN(byPos.GK, 1),
    pickTopN(byPos.DEF, f.defenders),
    pickTopN(byPos.MID, f.midfielders),
    pickTopN(byPos.ATT, f.attackers),
  ];
  const picked = parts.flatMap((p) => p.picked);
  return {
    ...f,
    picked,
    tiedOut: parts.flatMap((p) => p.tiedOut),
    total: picked.reduce((s, p) => s + p.points, 0),
    complete: picked.length === 11,
  };
}

/**
 * Adviseert de formatie waarmee de beste spelers van de gekozen wedstrijden samen de meeste
 * punten opleveren. Per positie worden simpelweg de topscorers gepakt, dus het totaal is het
 * hoogst haalbare voor die formatie.
 *
 * Bij een gelijk totaal wint de formatie die de minste gelijkgeplaatste spelers buiten de
 * boot laat vallen: hebben vier middenvelders evenveel punten, dan gaat de voorkeur uit naar
 * een formatie waar ze allemaal in passen. Daarna geldt de volgorde van de formatielijst.
 */
export function adviseFormation(
  byPos: ByPosition,
  formations: FormationDef[]
): { evaluations: FormationEvaluation[]; recommendedCode: string | null } {
  const evaluations = formations.map((f) => evaluateFormation(byPos, f));
  if (evaluations.length === 0) return { evaluations, recommendedCode: null };
  const pool = evaluations.some((e) => e.complete) ? evaluations.filter((e) => e.complete) : evaluations;
  const best = pool.reduce((a, b) => {
    if (b.total !== a.total) return b.total > a.total ? b : a;
    return b.tiedOut.length < a.tiedOut.length ? b : a;
  });
  return { evaluations, recommendedCode: best.code };
}
