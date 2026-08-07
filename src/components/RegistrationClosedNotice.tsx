import Link from "next/link";

export default function RegistrationClosedNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-center">
        <p className="text-sm font-bold text-amber-400">🔒 Transfermarkt gesloten</p>
        <p className="text-slate-500 text-xs mt-1">Inschrijven kan niet meer dit seizoen.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 px-5 py-6 text-center">
      <p className="text-3xl mb-2">🔒</p>
      <p className="text-white font-black text-lg">Transfermarkt gesloten</p>
      <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
        Net te laat! Inschrijven kan niet meer — de transferperiode voor dit seizoen zit erop. Bekijk de tussenstand
        om te zien wie de sterkste opstelling heeft neergezet.
      </p>
      <Link
        href="/tussenstand"
        className="inline-block mt-4 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-xl text-sm border border-cyan-500/20 transition-colors"
      >
        Bekijk de tussenstand →
      </Link>
    </div>
  );
}
