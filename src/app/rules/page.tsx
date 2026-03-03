import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function RulesPage() {
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  const rulesText = settings?.rulesText ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-700 to-green-900 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/"
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            ← Terug
          </Link>
          <h1 className="text-2xl font-black text-gray-800">Spelregels</h1>
        </div>

        {rulesText ? (
          <div className="prose prose-sm max-w-none text-gray-700 space-y-3">
            {rulesText.split("\n").map((line, i) =>
              line.trim() ? (
                <p key={i}>{line}</p>
              ) : (
                <br key={i} />
              )
            )}
          </div>
        ) : (
          <p className="text-gray-400 italic">
            De spelregels zijn nog niet ingesteld door de admin.
          </p>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link
            href="/register"
            className="block w-full text-center py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
          >
            Deelnemen
          </Link>
        </div>
      </div>
    </div>
  );
}
