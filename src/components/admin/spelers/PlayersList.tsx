import { useEffect, useState } from "react";
import type { Player } from "./types";
import { POSITIONS, TEAMS, POSITION_LABEL, POSITION_SHORT, TEAM_LABEL, BTN_PRIMARY, BTN_DANGER, BTN_SMALL } from "./constants";

type Props = {
  players: Player[];
  loadingPlayers: boolean;
  filterName: string;
  setFilterName: (v: string) => void;
  filterTeam: string;
  setFilterTeam: (v: string) => void;
  filterPosition: string;
  setFilterPosition: (v: string) => void;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  confirmBulk: boolean;
  setConfirmBulk: (v: boolean) => void;
  bulkDelete: () => void;
  bulkDeleting: boolean;
  setSelectedIds: (v: Set<string>) => void;
  onOpenAdd: () => void;
  onOpenPlayerStats: (player: Player) => void;
};

type SortKey = "naam" | "positie" | "elftal" | "waarde" | "punten";
type SortDir = "asc" | "desc";
type ColumnKey = "positie" | "elftal" | "waarde" | "punten";

const COLUMN_DEFS: { key: ColumnKey; label: string; sortKey: SortKey }[] = [
  { key: "positie", label: "Pos", sortKey: "positie" },
  { key: "elftal", label: "Elftal", sortKey: "elftal" },
  { key: "waarde", label: "Waarde", sortKey: "waarde" },
  { key: "punten", label: "Punten", sortKey: "punten" },
];

const DEFAULT_COLUMNS: ColumnKey[] = ["positie", "elftal", "waarde", "punten"];
const COLUMNS_STORAGE_KEY = "profcoach_admin_spelers_columns";

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-slate-700 ml-1">↕</span>;
  return <span className="text-cyan-400 ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

export default function PlayersList({
  players,
  loadingPlayers,
  filterName,
  setFilterName,
  filterTeam,
  setFilterTeam,
  filterPosition,
  setFilterPosition,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  confirmBulk,
  setConfirmBulk,
  bulkDelete,
  bulkDeleting,
  setSelectedIds,
  onOpenAdd,
  onOpenPlayerStats,
}: Props) {
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
      setSortDir(key === "punten" || key === "waarde" ? "desc" : "asc");
    }
  }

  const filtersActive = filterTeam !== "" || filterPosition !== "";

  const filteredPlayers = players.filter((p) => {
    if (filterName && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterTeam && p.clubTeam !== filterTeam) return false;
    if (filterPosition && p.position !== filterPosition) return false;
    return true;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const mult = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "naam":
        return mult * a.name.localeCompare(b.name, "nl");
      case "positie":
        return mult * a.position.localeCompare(b.position, "nl");
      case "elftal":
        return mult * TEAM_LABEL[a.clubTeam].localeCompare(TEAM_LABEL[b.clubTeam], "nl");
      case "waarde":
        return mult * (a.value - b.value);
      case "punten":
        return mult * (a.totalPoints - b.totalPoints);
      default:
        return 0;
    }
  });

  return (
    <section className="bg-slate-900 neon-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white">Spelersbeheer</h2>
        <button onClick={onOpenAdd} className={BTN_PRIMARY}>
          + Nieuwe speler
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Zoek op naam..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm w-56 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
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
            <div className="absolute top-full left-0 mt-1.5 z-30 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 w-60 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Elftal</p>
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                >
                  <option value="">Alle elftallen</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>{TEAM_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Positie</p>
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                >
                  <option value="">Alle posities</option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>{POSITION_LABEL[p]}</option>
                  ))}
                </select>
              </div>
              {filtersActive && (
                <button
                  onClick={() => { setFilterTeam(""); setFilterPosition(""); }}
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
            <div className="absolute top-full left-0 mt-1.5 z-30 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3 w-52">
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

      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 px-3 py-2.5 bg-red-900/20 border border-red-500/30 rounded-lg">
          <span className="text-sm font-medium text-red-400">
            {selectedIds.size} speler{selectedIds.size !== 1 ? "s" : ""} geselecteerd
          </span>
          <div className="flex-1 hidden sm:block" />
          {confirmBulk ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-red-400">Zeker weten?</span>
              <button onClick={bulkDelete} disabled={bulkDeleting} className={BTN_DANGER + " disabled:opacity-50"}>
                {bulkDeleting ? "Bezig..." : "Ja, verwijder"}
              </button>
              <button onClick={() => setConfirmBulk(false)} className={BTN_SMALL}>
                Annuleer
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setConfirmBulk(true)} className={BTN_DANGER}>
                Verwijder selectie
              </button>
              <button onClick={() => setSelectedIds(new Set())} className={BTN_SMALL}>
                Deselecteer
              </button>
            </div>
          )}
        </div>
      )}

      {loadingPlayers ? (
        <p className="text-slate-500 text-sm py-4">Laden...</p>
      ) : sortedPlayers.length === 0 ? (
        <div className="py-6 text-center">
          {players.length === 0 ? (
            <>
              <p className="text-slate-500 text-sm mb-3">Nog geen spelers toegevoegd.</p>
              <button onClick={onOpenAdd} className={BTN_PRIMARY}>
                + Eerste speler toevoegen
              </button>
            </>
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-2">Geen spelers gevonden voor deze filters.</p>
              <button
                onClick={() => {
                  setFilterName("");
                  setFilterTeam("");
                  setFilterPosition("");
                }}
                className={BTN_SMALL}
              >
                Filters wissen
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="pb-3 pr-3 w-8">
                  <input
                    type="checkbox"
                    checked={sortedPlayers.length > 0 && sortedPlayers.every((p) => selectedIds.has(p.id))}
                    ref={(el) => {
                      if (el)
                        el.indeterminate =
                          sortedPlayers.some((p) => selectedIds.has(p.id)) &&
                          !sortedPlayers.every((p) => selectedIds.has(p.id));
                    }}
                    onChange={toggleSelectAll}
                    className="rounded accent-cyan-500"
                  />
                </th>
                <th className="pb-3 pr-3 font-semibold">
                  <button onClick={() => handleSortClick("naam")} className="flex items-center hover:text-white transition-colors">
                    Naam <SortArrow active={sortKey === "naam"} dir={sortDir} />
                  </button>
                </th>
                {COLUMN_DEFS.filter((c) => visibleColumns.has(c.key)).map((col) => (
                  <th
                    key={col.key}
                    className="pb-3 px-3 font-semibold"
                    title={col.key === "punten" ? "Seizoenspunten uit wedstrijdprestaties, exclusief aanvoerdersbonus" : undefined}
                  >
                    <button onClick={() => handleSortClick(col.sortKey)} className="flex items-center hover:text-white transition-colors">
                      {col.label} <SortArrow active={sortKey === col.sortKey} dir={sortDir} />
                    </button>
                  </th>
                ))}
                <th className="pb-3 pl-3 font-semibold text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => (
                <tr
                  key={player.id}
                  className={`border-b border-slate-800/60 ${
                    selectedIds.has(player.id) ? "bg-red-900/10" : "hover:bg-slate-800/30"
                  }`}
                >
                  <td className="py-3 pr-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(player.id)}
                      onChange={() => toggleSelect(player.id)}
                      className="rounded accent-cyan-500"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-white">{player.name}</span>
                      {player.altTeam && (
                        <span className="text-[9px] font-bold text-violet-400 bg-violet-900/30 border border-violet-500/30 px-1 py-0.5 rounded shrink-0">
                          FLEX
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 sm:hidden">
                      {TEAM_LABEL[player.clubTeam]}
                      {player.altTeam && (
                        <span className="text-violet-400"> → {TEAM_LABEL[player.altTeam]}</span>
                      )}
                    </div>
                  </td>
                  {visibleColumns.has("positie") && (
                    <td className="py-3 px-3 text-slate-400">{POSITION_SHORT[player.position]}</td>
                  )}
                  {visibleColumns.has("elftal") && (
                    <td className="py-3 px-3 text-slate-400">
                      {TEAM_LABEL[player.clubTeam]}
                      {player.altTeam && (
                        <span className="text-violet-400 text-xs"> → {TEAM_LABEL[player.altTeam]}</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.has("waarde") && (
                    <td className="py-3 px-3 text-slate-400">€{player.value}</td>
                  )}
                  {visibleColumns.has("punten") && (
                    <td className="py-3 px-3 text-cyan-400 font-semibold">{player.totalPoints}</td>
                  )}
                  <td className="py-3 pl-3 text-right">
                    <button onClick={() => onOpenPlayerStats(player)} className={BTN_SMALL}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-600 mt-3">
            {sortedPlayers.length} van {players.length} spelers
            {selectedIds.size > 0 && ` · ${selectedIds.size} geselecteerd`}
          </p>
        </div>
      )}
    </section>
  );
}
