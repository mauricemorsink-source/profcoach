import { useState } from "react";
import type { Deelnemer } from "./types";
import { BTN_SMALL } from "./constants";

type Props = {
  deelnemers: Deelnemer[];
  loading: boolean;
  onRefresh: () => void;
  onOpenModal: (d: Deelnemer) => void;
};

type SortOption = "naam-az" | "naam-za" | "datum-nieuw" | "datum-oud" | "punten-hoog" | "punten-laag";

function totaalPunten(d: Deelnemer): number {
  return d.players.reduce((s, tp) => s + tp.totalPoints, 0) + d.captainPoints + d.bonusPoints;
}

export default function DeelnemersList({
  deelnemers,
  loading,
  onRefresh,
  onOpenModal,
}: Props) {
  const [search, setSearch] = useState("");
  const [betaaldFilter, setBetaaldFilter] = useState<"alle" | "betaald" | "nietbetaald">("alle");
  const [whatsappFilter, setWhatsappFilter] = useState<"alle" | "ja" | "nee">("alle");
  const [sort, setSort] = useState<SortOption>("naam-az");

  const filtered = deelnemers
    .filter((d) =>
      betaaldFilter === "betaald" ? d.betaald :
      betaaldFilter === "nietbetaald" ? !d.betaald : true
    )
    .filter((d) =>
      whatsappFilter === "ja" ? d.whatsappGroep :
      whatsappFilter === "nee" ? !d.whatsappGroep : true
    )
    .filter((d) => {
      if (!search.trim()) return true;
      const term = search.trim().toLowerCase();
      const naam = `${d.voornaam ?? ""} ${d.achternaam ?? ""}`.toLowerCase();
      const email = (d.email ?? "").toLowerCase();
      return naam.includes(term) || email.includes(term);
    });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "naam-az":
        return `${a.voornaam ?? ""} ${a.achternaam ?? ""}`.trim().localeCompare(`${b.voornaam ?? ""} ${b.achternaam ?? ""}`.trim(), "nl");
      case "naam-za":
        return `${b.voornaam ?? ""} ${b.achternaam ?? ""}`.trim().localeCompare(`${a.voornaam ?? ""} ${a.achternaam ?? ""}`.trim(), "nl");
      case "datum-nieuw":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "datum-oud":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "punten-hoog":
        return totaalPunten(b) - totaalPunten(a);
      case "punten-laag":
        return totaalPunten(a) - totaalPunten(b);
      default:
        return 0;
    }
  });

  const aantalBetaald = deelnemers.filter((d) => d.betaald).length;

  return (
    <section className="bg-slate-900 neon-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Deelnemers</h2>
          {deelnemers.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              <span className={aantalBetaald === deelnemers.length && deelnemers.length > 0 ? "text-green-400 font-semibold" : "text-amber-400 font-semibold"}>
                {aantalBetaald}/{deelnemers.length} betaald
              </span>
            </p>
          )}
        </div>
        <button onClick={onRefresh} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Vernieuwen</button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op naam of e-mail..."
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-56 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
        />
        <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
          {(["alle", "betaald", "nietbetaald"] as const).map((v) => (
            <button key={v} onClick={() => setBetaaldFilter(v)}
              className={`px-3 py-1.5 font-medium transition-colors ${betaaldFilter === v ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
              {v === "alle" ? "Alle" : v === "betaald" ? "Betaald" : "Niet betaald"}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
          {(["alle", "ja", "nee"] as const).map((v) => (
            <button key={v} onClick={() => setWhatsappFilter(v)}
              className={`px-3 py-1.5 font-medium transition-colors ${whatsappFilter === v ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
              {v === "alle" ? "WhatsApp: alle" : v === "ja" ? "WhatsApp: ja" : "WhatsApp: nee"}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
        >
          <option value="naam-az">Naam (A-Z)</option>
          <option value="naam-za">Naam (Z-A)</option>
          <option value="datum-nieuw">Aanmeldatum (nieuw-oud)</option>
          <option value="datum-oud">Aanmeldatum (oud-nieuw)</option>
          <option value="punten-hoog">Punten (hoog-laag)</option>
          <option value="punten-laag">Punten (laag-hoog)</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm py-4">Laden...</p>
      ) : sorted.length === 0 ? (
        <p className="text-slate-500 text-sm py-4">Geen deelnemers gevonden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="pb-2 font-semibold">Naam</th>
                <th className="pb-2 font-semibold hidden sm:table-cell">E-mail</th>
                <th className="pb-2 font-semibold">Team</th>
                <th className="pb-2 font-semibold text-right">Punten</th>
                <th className="pb-2 font-semibold">Betaald</th>
                <th className="pb-2 font-semibold text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2 font-medium text-white whitespace-nowrap">
                    {d.voornaam || d.achternaam
                      ? `${d.voornaam ?? ""} ${d.achternaam ?? ""}`.trim()
                      : <span className="text-slate-500 italic">Geen naam</span>}
                  </td>
                  <td className="py-2 text-slate-400 text-xs hidden sm:table-cell">{d.email ?? "—"}</td>
                  <td className="py-2 whitespace-nowrap">
                    {d.formation
                      ? <span className="text-xs bg-cyan-900/30 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">{d.formation.code}</span>
                      : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="py-2 text-right text-cyan-400 font-semibold whitespace-nowrap">{totaalPunten(d)}</td>
                  <td className="py-2 whitespace-nowrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border whitespace-nowrap ${d.betaald ? "bg-green-900/40 text-green-400 border-green-500/30" : "bg-slate-800 text-slate-500 border-slate-700"}`}>
                      {d.betaald ? "Betaald" : "Niet betaald"}
                    </span>
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button onClick={() => onOpenModal(d)} className={BTN_SMALL} aria-label="Details">
                      <svg className="w-3.5 h-3.5 sm:hidden" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M10 3.5c-4.14 0-7.4 3.06-8.5 6.5 1.1 3.44 4.36 6.5 8.5 6.5s7.4-3.06 8.5-6.5c-1.1-3.44-4.36-6.5-8.5-6.5Zm0 11a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                      </svg>
                      <span className="hidden sm:inline">Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-600 mt-2">{sorted.length} van {deelnemers.length} deelnemers</p>
        </div>
      )}
    </section>
  );
}
