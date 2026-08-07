import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CONTENT_DEFS } from "@/lib/content";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const rows = await prisma.siteContent.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const items = CONTENT_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    group: def.group,
    multiline: def.multiline ?? false,
    value: byKey.get(def.key) ?? def.default,
  }));

  return NextResponse.json(items);
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  const { items } = body as { items: { key: string; value: string }[] };

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  const validKeys = new Set(CONTENT_DEFS.map((d) => d.key));
  const toSave = items.filter((it) => validKeys.has(it.key));

  await Promise.all(
    toSave.map((it) =>
      prisma.siteContent.upsert({
        where: { key: it.key },
        update: { value: String(it.value) },
        create: { key: it.key, value: String(it.value) },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
