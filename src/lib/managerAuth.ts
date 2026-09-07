import { NextRequest } from "next/server";
import { getSession, SessionPayload } from "@/lib/auth";
import { isValidManagerShareToken, isClubTeamCode } from "@/lib/managerShareLink";
import { rateLimit, getIp } from "@/lib/rateLimit";

export type ManagerAuthContext = {
  team: string;
  // null wanneer toegang via de anonieme gedeelde wedstrijdlink verloopt — er bestaat dan
  // geen sessie/account, dus createdById-achtige velden moeten null blijven.
  session: SessionPayload | null;
};

// Geeft toegang tot de manager-API's aan een ingelogde manager/admin (via sessie-cookie),
// of aan iedereen met een geldige gedeelde-link token — zonder dat de laatste ooit een
// sessie of account aanmaakt, dus zonder de sessie van een ingelogde admin te verstoren.
//
// Een shareToken in de URL wordt ALTIJD als eerste gecheckt en is dan doorslaggevend: de
// gedeelde link moet zelfstandig het juiste elftal bepalen, ongeacht welke sessie-cookie
// er toevallig nog in de browser staat (bv. een admin die ook is ingelogd, of een oude
// MANAGER-sessie van een eerder geopend elftal). Zonder deze volgorde kan een bestaande
// sessie stilletjes een ander elftal afdwingen dan het elftal waar de gebruiker op klikte.
export async function getManagerAuthContext(req: NextRequest): Promise<ManagerAuthContext | null> {
  const shareToken = req.nextUrl.searchParams.get("shareToken");
  if (shareToken) {
    const team = req.nextUrl.searchParams.get("team");
    if (!team || !isClubTeamCode(team)) return null;

    const { ok } = await rateLimit(`manager-share-api:${getIp(req)}`, { max: 120, windowMs: 15 * 60 * 1000 });
    if (!ok) return null;

    const valid = await isValidManagerShareToken(shareToken);
    if (!valid) return null;

    return { team, session: null };
  }

  const session = await getSession();
  if (session && (session.role === "MANAGER" || session.role === "ADMIN")) {
    const team = session.managedTeam || (session.role === "ADMIN" ? req.nextUrl.searchParams.get("adminTeam") : null);
    if (!team) return null;
    return { team, session };
  }

  return null;
}
