"use client";

import { useState } from "react";

type Deelnemer = {
  userId: string;
  userName: string;
  totalPoints: number;
  prevPoints: number;
  delta: number;
};

function Delta({ value }: { value: number }) {
  if (!value || !isFinite(value)) return null;
  return (
    <span className={`text-xs font-semibold ${value > 0 ? "text-emerald-400" : "text-red-400"}`}>
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

export default function DeelnemersTable({ deelnemers }: { deelnemers: Deelnemer[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? deelnemers.filter((d) => d.userName?.toLowerCase().includes(query.toLowerCase()))
    : deelnemers;

  return (
    <div className="bg-slate-900 neon-border rounded-2xl overflow-hidden">
      {/* Zoekbalk */}
      <div className="px-4 py-3 border-b border-slate-800">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op naam..."
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors"
        />
      </div>

      {deelnemers.length === 0 ? (
        <p className="text-slate-500 text-sm p-6">Nog geen punten verwerkt.</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-sm p-6">Geen deelnemers gevonden voor &quot;{query}&quot;.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-800 bg-slate-800/50">
              <th className="px-4 py-3 font-semibold w-10">#</th>
              <th className="px-4 py-3 font-semibold">Deelnemer</th>
              <th className="px-4 py-3 font-semibold text-right">Punten</th>
              <th className="px-4 py-3 font-semibold text-right">+/-</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              // Positie blijft altijd op de originele ranglijst, ook bij zoeken
              const rank = deelnemers.indexOf(d) + 1;
              return (
                <tr
                  key={d.userId}
                  className={`border-b border-slate-800/60 ${rank === 1 && !query ? "bg-cyan-500/5" : "hover:bg-slate-800/30"}`}
                >
                  <td className="px-4 py-3 text-slate-500 font-medium">{rank}</td>
                  <td className="px-4 py-3 font-semibold text-white">{d.userName}</td>
                  <td className="px-4 py-3 text-right font-bold text-cyan-400">{d.totalPoints}</td>
                  <td className="px-4 py-3 text-right"><Delta value={d.delta} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
