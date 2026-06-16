import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TeamAanpassenRequestClient from "@/components/TeamAanpassenRequestClient";

export default async function TeamAanpassenPage() {
  const settings = await prisma.gameSettings.findUnique({
    where: { id: "singleton" },
    select: { wijzigingsvensterOpen: true },
  });

  if (!settings?.wijzigingsvensterOpen) {
    redirect("/");
  }

  return <TeamAanpassenRequestClient />;
}
