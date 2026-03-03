import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json();
  const { role, managedTeam, isParticipant } = body;

  if (!["ADMIN", "USER", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Ongeldige rol" }, { status: 400 });
  }

  if (role === "MANAGER" && !managedTeam) {
    return NextResponse.json({ error: "Elftal is verplicht voor een teambeheerder" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      role,
      managedTeam: role === "MANAGER" ? managedTeam : null,
      isParticipant: role === "USER" ? true : (isParticipant ?? true),
    },
    select: { id: true, name: true, email: true, role: true, managedTeam: true, isParticipant: true },
  });

  return NextResponse.json(user);
}
