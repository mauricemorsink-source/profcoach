import { useEffect, useState } from "react";
import type { Deelnemer } from "./types";
import { BTN_SMALL } from "./constants";

type Props = {
  deelnemers: Deelnemer[];
  loading: boolean;
  onRefresh: () => void;
  onOpenModal: (d: Deelnemer) => void;
  onToggleWhatsappToegevoegd: (d: Deelnemer) => void;
};

type SortKey = "naam" | "team" | "punten" | "betaald" | "whatsapp" | "toegevoegd" | "datum";
type SortDir = "asc" | "desc";

type ColumnKey = "email" | "telefoon" | "team" | "punten" | "betaald" | "whatsapp" | "toegevoegd" | "datum";

const COLUMN_DEFS: { key: ColumnKey; label: string; sortKey?: SortKey }[] = [
  { key: "email", label: "E-mail" },
  { key: "telefoon", label: "Telefoon" },
  { key: "team", label: "Team", sortKey: "team" },
  { key: "punten", label: "Punten", sortKey: "punten" },
  { key: "betaald", label: "Betaald", sortKey: "betaald" },
  { key: "whatsapp", label: "WhatsApp", sortKey: "whatsapp" },
  { key: "toegevoegd", label: "Toegevoegd", sortKey: "toegevoegd" },
  { key: "datum", label: "Aangemeld", sortKey: "datum" },
];

const DEFAULT_COLUMNS: ColumnKey[] = ["email", "team", "punten", "betaald"];
const COLUMNS_STORAGE_KEY = "profcoach_admin_deelnemers_columns";

function totaalPunten(d: Deelnemer): number {
  return d.players.reduce((s, tp) => s + tp.totalPoints, 0) + d.captainPoints + d.bonusPoints;
}

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-slate-700 ml-1">↕</span>;
  return <span className="text-cyan-400 ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

export default function DeelnemersList({
  deelnemers,
  loading,
  onRefresh,
  onOpenModal,
  onToggleWhatsappToegevoegd,
}: Props) {
  const [search, setSearch] = useState("");
  const [betaaldFilter, setBetaaldFilter] = useState<"alle" | "betaald" | "nietbetaald">("alle");
  const [whatsappFilter, setWhatsappFilter] = useState<"alle" | "ja" | "nee">("alle");
  const [toegevoegdFilter, setToegevoegdFilter] = useState<"alle" | "ja" | "nee">("alle");
  const [sortKey, setSortKey] = useState<SortKey>("naam");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [openPanel, setOpenPanel] = useState<"filters" | "columns" | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(DEFAULT_COLUMNS));

  useEffect(() => {
    const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setVisibleColumns(new Set(parsed));
      } catch { /* negeer, val terug op default */ }
    }
  }, []);

  function toggleColumn(key: ColumnKey) {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }

  function handleSortClick(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "punten" || key === "datum" ? "desc" : "asc");
    }
  }

  const filtersActive = betaaldFilter !== "alle" || whatsappFilter !== "alle" || toegevoegdFilter !== "alle";

  const filtered = deelnemers
    .filter((d) =>
      betaaldFilter === "betaald" ? d.betaald :
      betaaldFilter === "nietbetaald" ? !d.betaald : true
    )
    .filter((d) =>
      whatsappFilter === "ja" ? d.whatsappGroep :
      whatsappFilter === "nee" ? !d.whatsappGroep : true
    )
    .filter((d) =>
      toegevoegdFilter === "ja" ? d.whatsappToegevoegd :
      toegevoegdFilter === "nee" ? !d.whatsappToegevoegd : true
    )
    .filter((d) => {
      if (!search.trim()) return true;
      const term = search.trim().toLowerCase();
      const naam = `${d.voornaam ?? ""} ${d.achternaam ?? ""}`.toLowerCase();
      const email = (d.email ?? "").toLowerCase();
      return naam.includes(term) || email.includes(term);
    });

  const sorted = [...filtered].sort((a, b) => {
    const mult = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "naam":
        return mult * `${a.voornaam ?? ""} ${a.achternaam ?? ""}`.trim().localeCompare(`${b.voornaam ?? ""} ${b.achternaam ?? ""}`.trim(), "nl");
      case "team":
        return mult * (a.formation?.code ?? "").localeCompare(b.formation?.code ?? "", "nl");
      case "punten":
        return mult * (totaalPunten(a) - totaalPunten(b));
      case "betaald":
        return mult * (Number(a.betaald) - Number(b.betaald));
      case "whatsapp":
        return mult * (Number(a.whatsappGroep) - Number(b.whatsappGroep));
      case "toegevoegd":
        return mult * (Number(a.whatsappToegevoegd) - Number(b.whatsappToegevoegd));
      case "datum":
        return mult * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      default:
        return 0;
    }
  });

  const aantalBetaald = deelnemers.filter((d) => d.betaald).length;

  return (
    <section className="bg-slate-900 neon-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Deelnemers</h2>
          {deelnemers.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              <span className={aantalBetaald === deelnemers.length && deelnemers.length > 0 ? "text-green-400 font-semibold" : "text-amber-400 font-semibold"}>
                {aantalBetaald}/{deelnemers.length} betaald
              </span>
            </p>
          )}
        </div>
        <button onClick={onRefresh} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Vernieuwen</button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op naam of e-mail..."
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm w-60 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
        />

        {/* Filters dropdown */}
        <div className="relative">
          {openPanel === "filters" && <div className="fixed inset-0 z-20" onClick={() => setOpenPanel(null)} />}
          <button
            onClick={() => setOpenPanel((p) => (p === "filters" ? null : "filters"))}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors relative z-20 ${
              openPanel === "filters" ? "border-cyan-500/60 bg-cyan-500/10 text-white" :
              filtersActive ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400" : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
            }`}
          >
            Filters
            {filtersActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
            <span className="text-slate-500">{openPanel === "filters" ? "▲" : "▼"}</span>
          </button>
          {openPanel === "filters" && (
            <div className="absolute top-full left-0 mt-1.5 z-30 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 w-64 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Betaald</p>
                <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
                  {(["alle", "betaald", "nietbetaald"] as const).map((v) => (
                    <button key={v} onClick={() => setBetaaldFilter(v)}
                      className={`flex-1 px-2 py-1.5 font-medium transition-colors ${betaaldFilter === v ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                      {v === "alle" ? "Alle" : v === "betaald" ? "Betaald" : "Niet"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Wil in WhatsApp-groep</p>
                <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
                  {(["alle", "ja", "nee"] as const).map((v) => (
                    <button key={v} onClick={() => setWhatsappFilter(v)}
                      className={`flex-1 px-2 py-1.5 font-medium transition-colors ${whatsappFilter === v ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                      {v === "alle" ? "Alle" : v === "ja" ? "Ja" : "Nee"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Toegevoegd aan groep</p>
                <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
                  {(["alle", "ja", "nee"] as const).map((v) => (
                    <button key={v} onClick={() => setToegevoegdFilter(v)}
                      className={`flex-1 px-2 py-1.5 font-medium transition-colors ${toegevoegdFilter === v ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                      {v === "alle" ? "Alle" : v === "ja" ? "Ja" : "Nee"}
                    </button>
                  ))}
                </div>
              </div>
              {filtersActive && (
                <button
                  onClick={() => { setBetaaldFilter("alle"); setWhatsappFilter("alle"); setToegevoegdFilter("alle"); }}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  Filters wissen
                </button>
              )}
            </div>
          )}
        </div>

        {/* Kolommen dropdown */}
        <div className="relative">
          {openPanel === "columns" && <div className="fixed inset-0 z-20" onClick={() => setOpenPanel(null)} />}
          <button
            onClick={() => setOpenPanel((p) => (p === "columns" ? null : "columns"))}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors relative z-20 ${
              openPanel === "columns" ? "border-cyan-500/60 bg-cyan-500/10 text-white" : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
            }`}
          >
            Kolommen
            <span className="text-slate-500">{openPanel === "columns" ? "▲" : "▼"}</span>
          </button>
          {openPanel === "columns" && (
            <div className="absolute top-full left-0 mt-1.5 z-30 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3 w-56">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Zichtbare kolommen</p>
              <div className="space-y-0.5">
                {COLUMN_DEFS.map((col) => (
                  <label key={col.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      className="accent-cyan-500"
                    />
                    <span className="text-sm text-slate-300">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
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
                <th className="pb-3 pr-3 font-semibold">
                  <button onClick={() => handleSortClick("naam")} className="flex items-center hover:text-white transition-colors">
                    Naam <SortArrow active={sortKey === "naam"} dir={sortDir} />
                  </button>
                </th>
                {COLUMN_DEFS.filter((c) => visibleColumns.has(c.key)).map((col) => (
                  <th key={col.key} className={`pb-3 px-3 font-semibold ${col.key === "punten" ? "text-right" : ""}`}>
                    {col.sortKey ? (
                      <button
                        onClick={() => handleSortClick(col.sortKey!)}
                        className={`flex items-center hover:text-white transition-colors ${col.key === "punten" ? "ml-auto" : ""}`}
                      >
                        {col.label} <SortArrow active={sortKey === col.sortKey} dir={sortDir} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
                <th className="pb-3 pl-3 font-semibold text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-3 pr-3 font-medium text-white whitespace-nowrap">
                    {d.voornaam || d.achternaam
                      ? `${d.voornaam ?? ""} ${d.achternaam ?? ""}`.trim()
                      : <span className="text-slate-500 italic">Geen naam</span>}
                  </td>
                  {visibleColumns.has("email") && (
                    <td className="py-3 px-3 text-slate-400 text-xs">{d.email ?? "—"}</td>
                  )}
                  {visibleColumns.has("telefoon") && (
                    <td className="py-3 px-3 text-slate-400 text-xs whitespace-nowrap">{d.telefoonnummer ?? "—"}</td>
                  )}
                  {visibleColumns.has("team") && (
                    <td className="py-3 px-3 whitespace-nowrap">
                      {d.formation
                        ? <span className="text-xs bg-cyan-900/30 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">{d.formation.code}</span>
                        : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                  )}
                  {visibleColumns.has("punten") && (
                    <td className="py-3 px-3 text-right text-cyan-400 font-semibold whitespace-nowrap">{totaalPunten(d)}</td>
                  )}
                  {visibleColumns.has("betaald") && (
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border whitespace-nowrap ${d.betaald ? "bg-green-900/40 text-green-400 border-green-500/30" : "bg-slate-800 text-slate-500 border-slate-700"}`}>
                        {d.betaald ? "Betaald" : "Niet betaald"}
                      </span>
                    </td>
                  )}
                  {visibleColumns.has("whatsapp") && (
                    <td className="py-3 px-3 whitespace-nowrap">
                      {d.whatsappGroep
                        ? <span className="text-xs px-2 py-0.5 rounded-full font-medium border bg-green-900/40 text-green-400 border-green-500/30">Ja</span>
                        : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                  )}
                  {visibleColumns.has("toegevoegd") && (
                    <td className="py-3 px-3 whitespace-nowrap">
                      {d.whatsappGroep ? (
                        <button
                          onClick={() => onToggleWhatsappToegevoegd(d)}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border whitespace-nowrap transition-colors ${
                            d.whatsappToegevoegd
                              ? "bg-green-900/40 text-green-400 border-green-500/30 hover:border-green-500/60"
                              : "bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500"
                          }`}
                        >
                          {d.whatsappToegevoegd ? "Toegevoegd" : "Nog niet"}
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.has("datum") && (
                    <td className="py-3 px-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  )}
                  <td className="py-3 pl-3 text-right whitespace-nowrap">
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
          <p className="text-xs text-slate-600 mt-3">{sorted.length} van {deelnemers.length} deelnemers</p>
        </div>
      )}
    </section>
  );
}
