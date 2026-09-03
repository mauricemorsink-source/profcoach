import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidManagerShareToken, CLUB_TEAM_CODES, CLUB_TEAM_LABEL } from "@/lib/managerShareLink";

export const dynamic = "force-dynamic";

export default async function ManagerShareLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = await isValidManagerShareToken(token);
  if (!valid) notFound();

  return (
    <div
      className="min-h-[calc(100vh-56px)] flex items-center justify-center p-8"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(14,40,80,0.7) 0%, #060b14 70%)" }}
    >
      <div className="bg-slate-900 neon-border rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-white mb-1">Wedstrijd indienen</h1>
        <p className="text-slate-500 text-sm mb-6">Kies je elftal om verder te gaan:</p>
        <div className="grid grid-cols-2 gap-3">
          {CLUB_TEAM_CODES.map((t) => (
            <Link
              key={t}
              href={`/manager/${token}/${t}`}
              className="block text-center py-3 px-4 bg-slate-800 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-400 font-semibold rounded-xl border border-slate-700 hover:border-cyan-500/30 transition-colors"
            >
              {CLUB_TEAM_LABEL[t]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
