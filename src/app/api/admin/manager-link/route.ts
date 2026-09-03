import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getManagerShareLink, generateManagerShareLink } from "@/lib/managerShareLink";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const link = await getManagerShareLink();
  return NextResponse.json({ token: link?.token ?? null, createdAt: link?.createdAt ?? null });
}

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const link = await generateManagerShareLink();
  return NextResponse.json({ token: link.token, createdAt: link.createdAt });
}
