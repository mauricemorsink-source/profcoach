import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { marked } from "marked";

export default async function RulesPage() {
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  const rulesText = settings?.rulesText ?? "";
  const rulesHtml = rulesText
    ? marked.parse(rulesText, { breaks: true }) as string
    : "";

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
          <h1 className="text-2xl font-black text-white mb-6">Spelregels</h1>

          {rulesHtml ? (
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
                [&_a]:text-cyan-400 [&_a:hover]:text-cyan-300 [&_a]:underline
                [&_hr]:border-slate-700 [&_hr]:my-6
                [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-500/40 [&_blockquote]:pl-4 [&_blockquote]:text-slate-400 [&_blockquote]:italic
                [&_code]:bg-slate-800 [&_code]:text-cyan-300 [&_code]:px-1 [&_code]:rounded [&_code]:text-sm
              "
              dangerouslySetInnerHTML={{ __html: rulesHtml }}
            />
          ) : (
            <p className="text-slate-500 italic">
              De spelregels zijn nog niet ingesteld door de beheerder.
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800">
            <Link
              href="/register"
              className="block w-full text-center py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors neon-glow-sm"
            >
              Deelnemen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
