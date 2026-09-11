import type { Match } from "./types";
import { TEAM_LABEL } from "./constants";

export function MatchSelector({
  sortedGroups,
  selectedMatchIds,
  toggleMatch,
  toggleGroup,
}: {
  sortedGroups: { label: string; sortKey: string; matches: Match[] }[];
  selectedMatchIds: Set<string>;
  toggleMatch: (id: string) => void;
  toggleGroup: (groupMatches: Match[]) => void;
}) {
  return (
    <section className="bg-slate-900 neon-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">
          Selecteer wedstrijden
          {selectedMatchIds.size > 0 && (
            <span className="ml-2 text-cyan-400 font-normal">({selectedMatchIds.size} geselecteerd)</span>
          )}
        </h2>
      </div>
      <div className="space-y-5">
        {sortedGroups.map(({ label, matches: groupMatches }) => {
          const allSelected = groupMatches.every((m) => selectedMatchIds.has(m.id));
          const someSelected = groupMatches.some((m) => selectedMatchIds.has(m.id));
          return (
            <div key={label}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-300 capitalize">{label}</span>
                <button
                  onClick={() => toggleGroup(groupMatches)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                    allSelected
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                      : someSelected
                      ? "bg-slate-700 text-slate-300 border-slate-600"
                      : "text-slate-600 border-slate-700 hover:text-slate-400"
                  }`}
                >
                  {allSelected ? "Alles uit" : "Alles aan"}
                </button>
              </div>
              <div className="space-y-1 pl-1">
                {groupMatches.map((match) => {
                  const checked = selectedMatchIds.has(match.id);
                  return (
                    <label
                      key={match.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        checked ? "bg-cyan-500/10 border border-cyan-500/20" : "hover:bg-slate-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMatch(match.id)}
                        className="accent-cyan-500 w-4 h-4 shrink-0"
                      />
                      <span className="text-sm text-white font-medium flex-1">{match.name}</span>
                      <span className="text-slate-400 text-xs shrink-0">
                        {TEAM_LABEL[match.clubTeam] ?? match.clubTeam}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
