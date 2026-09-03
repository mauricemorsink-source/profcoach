import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import {
  isValidManagerShareToken,
  isClubTeamCode,
  ensureManagerShareUser,
  CLUB_TEAM_LABEL,
} from "@/lib/managerShareLink";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; team: string }> }
) {
  const { ok } = await rateLimit(`manager-share:${getIp(req)}`, { max: 30, windowMs: 15 * 60 * 1000 });
  if (!ok) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const { token, team } = await params;
  const valid = await isValidManagerShareToken(token);
  if (!valid || !isClubTeamCode(team)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const shareUser = await ensureManagerShareUser();
  await setSessionCookie({
    userId: shareUser.id,
    email: shareUser.email,
    name: `${CLUB_TEAM_LABEL[team]} (gedeelde link)`,
    role: "MANAGER",
    managedTeam: team,
    isParticipant: false,
  });

  return NextResponse.redirect(new URL("/manager", req.url));
}
