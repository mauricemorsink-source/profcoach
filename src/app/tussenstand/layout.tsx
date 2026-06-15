import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TussenstandTabs from "@/components/tussenstand/TussenstandTabs";

export default async function TussenstandLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  const updatedAt = settings?.standingsUpdatedAt
    ? new Date(settings.standingsUpdatedAt).toLocaleString("nl-NL", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam",
      })
    : null;

  return (
    <div
      className="min-h-[calc(100vh-56px)] p-4 sm:p-8"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(14,40,80,0.6) 0%, #060b14 60%)" }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Tussenstand</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {updatedAt ? `Bijgewerkt op ${updatedAt}` : "Nog niet bijgewerkt"}
          </p>
        </div>
        <TussenstandTabs />
        {children}
      </div>
    </div>
  );
}
