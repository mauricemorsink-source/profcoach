import { randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const CLUB_TEAM_CODES = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "DAMES"] as const;
export type ClubTeamCode = (typeof CLUB_TEAM_CODES)[number];
export const CLUB_TEAM_LABEL: Record<ClubTeamCode, string> = {
  ONE: "Rietmolen 1",
  TWO: "Rietmolen 2",
  THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4",
  FIVE: "Rietmolen 5",
  DAMES: "Rietmolen VR1",
};

export function isClubTeamCode(value: string): value is ClubTeamCode {
  return (CLUB_TEAM_CODES as readonly string[]).includes(value);
}

// E-mailadres van de systeemgebruiker die als "auteur" dient voor wedstrijden die via de
// gedeelde link zijn ingediend — puur een FK-anker, logt nooit ergens mee in.
const SHARE_USER_EMAIL = "wedstrijdlink@profcoach.systeem";

export async function getManagerShareLink() {
  return prisma.managerShareLink.findUnique({ where: { id: "singleton" } });
}

export async function generateManagerShareLink() {
  const token = randomBytes(32).toString("hex");
  return prisma.managerShareLink.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", token },
    update: { token, createdAt: new Date() },
  });
}

export async function isValidManagerShareToken(token: string): Promise<boolean> {
  if (!token) return false;
  const link = await getManagerShareLink();
  if (!link) return false;
  const provided = Buffer.from(token);
  const expected = Buffer.from(link.token);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function ensureManagerShareUser() {
  return prisma.user.upsert({
    where: { email: SHARE_USER_EMAIL },
    create: {
      email: SHARE_USER_EMAIL,
      password: hashPassword(randomBytes(16).toString("hex")),
      name: "Gedeelde wedstrijd-link (systeem)",
      role: "MANAGER",
      isParticipant: false,
    },
    update: {},
  });
}
