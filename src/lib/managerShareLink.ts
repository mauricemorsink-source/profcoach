import { randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

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
