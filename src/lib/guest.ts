// Een speler speelt "als gast" wanneer de wedstrijd voor een ander elftal is dan zijn eigen
// elftal. Flexspelers (altTeam) die bij hun tweede elftal spelen, zijn geen gast.
export function isGuestAppearance(
  matchClubTeam: string,
  player: { clubTeam: string; altTeam?: string | null }
): boolean {
  return player.clubTeam !== matchClubTeam && (player.altTeam ?? null) !== matchClubTeam;
}
