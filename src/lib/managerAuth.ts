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
export async function getManagerAuthContext(req: NextRequest): Promise<ManagerAuthContext | null> {
  const session = await getSession();
  if (session && (session.role === "MANAGER" || session.role === "ADMIN")) {
    const team = session.managedTeam || (session.role === "ADMIN" ? req.nextUrl.searchParams.get("adminTeam") : null);
    if (!team) return null;
    return { team, session };
  }

  const shareToken = req.nextUrl.searchParams.get("shareToken");
  const team = req.nextUrl.searchParams.get("team");
  if (!shareToken || !team || !isClubTeamCode(team)) return null;

  const { ok } = await rateLimit(`manager-share-api:${getIp(req)}`, { max: 120, windowMs: 15 * 60 * 1000 });
  if (!ok) return null;

  const valid = await isValidManagerShareToken(shareToken);
  if (!valid) return null;

  return { team, session: null };
}
