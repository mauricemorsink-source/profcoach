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
  const filteredPlayers = players.filter((p) => {
    if (filterName && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterTeam && p.clubTeam !== filterTeam) return false;
    if (filterPosition && p.position !== filterPosition) return false;
    return true;
  });

  return (
    <section className="bg-slate-900 neon-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Spelersbeheer</h2>
        <button onClick={onOpenAdd} className={BTN_PRIMARY}>
          + Nieuwe speler
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Zoek op naam..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-44 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
        />
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
        >
          <option value="">Alle elftallen</option>
          {TEAMS.map((t) => (
            <option key={t} value={t}>
              {TEAM_LABEL[t]}
            </option>
          ))}
        </select>
        <select
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
        >
          <option value="">Alle posities</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {POSITION_LABEL[p]}
            </option>
          ))}
        </select>
        {(filterName || filterTeam || filterPosition) && (
          <button
            onClick={() => {
              setFilterName("");
              setFilterTeam("");
              setFilterPosition("");
            }}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Wis filters
          </button>
        )}
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
      ) : filteredPlayers.length === 0 ? (
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
                <th className="pb-2 pr-3 w-8">
                  <input
                    type="checkbox"
                    checked={filteredPlayers.length > 0 && filteredPlayers.every((p) => selectedIds.has(p.id))}
                    ref={(el) => {
                      if (el)
                        el.indeterminate =
                          filteredPlayers.some((p) => selectedIds.has(p.id)) &&
                          !filteredPlayers.every((p) => selectedIds.has(p.id));
                    }}
                    onChange={toggleSelectAll}
                    className="rounded accent-cyan-500"
                  />
                </th>
                <th className="pb-2 font-semibold">Naam</th>
                <th className="pb-2 font-semibold">Pos</th>
                <th className="pb-2 font-semibold hidden sm:table-cell">Elftal</th>
                <th className="pb-2 font-semibold">Waarde</th>
                <th className="pb-2 font-semibold text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr
                  key={player.id}
                  className={`border-b border-slate-800/60 ${
                    selectedIds.has(player.id) ? "bg-red-900/10" : "hover:bg-slate-800/30"
                  }`}
                >
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(player.id)}
                      onChange={() => toggleSelect(player.id)}
                      className="rounded accent-cyan-500"
                    />
                  </td>
                  <td className="py-2">
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
                  <td className="py-2 text-slate-400">{POSITION_SHORT[player.position]}</td>
                  <td className="py-2 text-slate-400 hidden sm:table-cell">
                    {TEAM_LABEL[player.clubTeam]}
                    {player.altTeam && (
                      <span className="text-violet-400 text-xs"> → {TEAM_LABEL[player.altTeam]}</span>
                    )}
                  </td>
                  <td className="py-2 text-slate-400">€{player.value}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => onOpenPlayerStats(player)} className={BTN_SMALL}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-600 mt-2">
            {filteredPlayers.length} van {players.length} spelers
            {selectedIds.size > 0 && ` · ${selectedIds.size} geselecteerd`}
          </p>
        </div>
      )}
    </section>
  );
}
