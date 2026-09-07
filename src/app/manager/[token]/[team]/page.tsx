import { notFound } from "next/navigation";
import { isValidManagerShareToken, isClubTeamCode, CLUB_TEAM_LABEL } from "@/lib/managerShareLink";
import ManagerClient from "@/app/manager/ManagerClient";

export const dynamic = "force-dynamic";

export default async function ManagerShareTeamPage({
  params,
}: {
  params: Promise<{ token: string; team: string }>;
}) {
  const { token, team } = await params;
  const valid = await isValidManagerShareToken(token);
  if (!valid || !isClubTeamCode(team)) notFound();

  return (
    <ManagerClient
      managedTeam={team}
      managerName={`${CLUB_TEAM_LABEL[team]} (gedeelde link)`}
      shareToken={token}
    />
  );
}
