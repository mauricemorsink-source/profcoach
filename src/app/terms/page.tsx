import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { marked } from "marked";

export default async function TermsPage() {
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  const text = settings?.termsText ?? "";
  const html = text ? marked.parse(text, { breaks: true }) as string : "";

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(14,40,80,0.8) 0%, #060b14 70%)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Terug naar home
          </Link>
        </div>

        <div className="bg-slate-900 neon-border rounded-2xl p-6 sm:p-8">
          <h1 className="text-2xl font-black text-white mb-6">Algemene voorwaarden</h1>

          {html ? (
            <div
              className="
                text-slate-300 leading-relaxed
                [&_h1]:text-white [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3
                [&_h2]:text-cyan-400 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2
                [&_h3]:text-white [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                [&_p]:mb-3
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
                [&_li]:text-slate-300
                [&_strong]:text-white [&_strong]:font-semibold
                [&_em]:text-slate-400
                [&_hr]:border-slate-700 [&_hr]:my-6
              "
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-slate-500 italic">
              De algemene voorwaarden zijn nog niet ingesteld.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
