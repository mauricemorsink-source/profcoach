// Datums staan als UTC in de database, maar worden in de admin ingevuld en gelezen als
// Nederlandse tijd. Een <input type="datetime-local"> heeft geen tijdzone-besef: hij geeft
// en verwacht een kale wandkloktijd ("2026-09-18T23:59"). Zonder expliciete conversie wordt
// die string door `new Date()` op de server als UTC geparsed, waardoor alles wat de beheerder
// invult 's zomers 2 uur (en 's winters 1 uur) te laat in de database landt.
//
// Bewust een vaste zone i.p.v. de browserzone: een deadline of publicatiemoment moet hetzelfde
// moment betekenen, ook als de beheerder vanuit het buitenland inlogt.
const TZ = "Europe/Amsterdam";

/** UTC-ISO uit de database -> waarde voor een <input type="datetime-local"> in NL-tijd. */
export function utcIsoToLocalInput(iso: string): string {
  // sv-SE levert "2026-09-18 23:59" -- ISO-achtig, dus direct bruikbaar na de spatie-swap.
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso)).replace(" ", "T");
}

/** Waarde uit een <input type="datetime-local"> (NL-tijd) -> UTC-ISO voor de database. */
export function localInputToUtcIso(local: string): string {
  // Neem de ingevoerde wandkloktijd eerst als UTC, kijk welke NL-tijd dat oplevert, en
  // corrigeer met dat verschil. Zo wordt de zomer-/wintertijdoffset automatisch goed toegepast.
  const asUtc = new Date(`${local}:00Z`);
  const drift = asUtc.getTime() - new Date(`${utcIsoToLocalInput(asUtc.toISOString())}:00Z`).getTime();
  return new Date(asUtc.getTime() + drift).toISOString();
}
