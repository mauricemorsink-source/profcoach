"use client";

import type { Match } from "./types";
import { TEAM_LABEL, STATUS_LABEL, STATUS_STYLE } from "./constants";

export default function MatchList({
  matches,
  loading,
  managedTeam,
  onOpenPerformances,
  onOpenAddModal,
}: {
  matches: Match[];
  loading: boolean;
  managedTeam: string;
  onOpenPerformances: (matchId: string) => void;
  onOpenAddModal: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-300">
          Wedstrijden {TEAM_LABEL[managedTeam] ?? managedTeam}
        </h2>
        <button
          onClick={onOpenAddModal}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-colors neon-glow-sm"
        >
          + Wedstrijd toevoegen
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Laden...</p>
      ) : matches.length === 0 ? (
        <div className="bg-slate-900 neon-border rounded-xl p-10 text-center">
          <p className="text-slate-500 text-sm">Nog geen wedstrijden ingevoerd.</p>
        </div>
      ) : (
        <div className="bg-slate-900 neon-border rounded-xl relative overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-700/50 bg-slate-800/50">
                <th className="px-3 py-3 font-medium text-xs sm:text-sm sm:px-4">Datum</th>
                <th className="px-3 py-3 font-medium text-xs sm:text-sm sm:px-4">Tegenstander</th>
                <th className="hidden sm:table-cell px-4 py-3 font-medium">T/U</th>
                <th className="px-3 py-3 font-medium text-xs sm:text-sm sm:px-4">Score</th>
                <th className="px-3 py-3 font-medium text-xs sm:text-sm sm:px-4">Status</th>
                <th className="px-3 py-3 font-medium text-right text-xs sm:text-sm sm:px-4">Acties</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-3 text-slate-400 text-xs sm:px-4 whitespace-nowrap">
                    <span className="hidden sm:inline">{new Date(m.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="sm:hidden">{new Date(m.matchDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</span>
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <div className="font-medium text-white text-sm">{m.name}</div>
                    <div className="text-xs text-slate-500 sm:hidden">
                      {m.homeAway === "HOME" ? "Thuis" : m.homeAway === "AWAY" ? "Uit" : "Neutraal"}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-slate-400 text-xs">
                    {m.homeAway === "HOME" ? "Thuis" : m.homeAway === "AWAY" ? "Uit" : "Neutraal"}
                  </td>
                  <td className="px-3 py-3 sm:px-4 text-slate-300 font-mono text-xs sm:text-sm whitespace-nowrap">
                    {m.homeAway === "AWAY" ? m.goalsConceded : m.goalsScored}
                    {" – "}
                    {m.homeAway === "AWAY" ? m.goalsScored : m.goalsConceded}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_STYLE[m.status]}`}>
                      {STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-4 text-right">
                    <button
                      onClick={() => onOpenPerformances(m.id)}
                      className={`px-2 py-1 sm:px-3 text-xs rounded font-medium transition-colors whitespace-nowrap ${
                        m.status === "PENDING"
                          ? "bg-cyan-900/50 text-cyan-400 hover:bg-cyan-800/50 border border-cyan-500/30"
                          : m.status === "APPROVED" || m.status === "REJECTED"
                          ? "bg-amber-900/40 text-amber-400 hover:bg-amber-800/40 border border-amber-500/30"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-600"
                      }`}
                    >
                      <span className="sm:hidden">
                        {m.status === "PENDING" ? "Bewerken" : m.status === "APPROVED" || m.status === "REJECTED" ? "Corrigeren" : "Bekijken"}
                      </span>
                      <span className="hidden sm:inline">
                        {m.status === "PENDING" ? "Prestaties bewerken" : m.status === "APPROVED" || m.status === "REJECTED" ? "Corrigeren" : "Bekijken"}
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-slate-900 to-transparent sm:hidden" />
        </div>
      )}
    </div>
  );
}
