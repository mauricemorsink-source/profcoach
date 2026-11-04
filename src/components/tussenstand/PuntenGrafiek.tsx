"use client";

import { useState } from "react";

export type ChartSeries = {
  label: string;
  /** De deelnemer waar de pagina over gaat, of de eerste in een vergelijking. */
  highlight?: boolean;
  points: { t: number; y: number; rank: number }[];
};

const W = 600;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 32, left: 40 };
const DASHES = ["", "6 4", "2 3", "10 4 2 4"];

function fmtDate(t: number) {
  return new Date(t).toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });
}

function fmtDateLong(t: number) {
  return new Date(t).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" });
}

export default function PuntenGrafiek({ series }: { series: ChartSeries[] }) {
  const [selectedT, setSelectedT] = useState<number | null>(null);

  const all = series.flatMap((s) => s.points);
  if (all.length === 0) {
    return <p className="text-slate-500 text-sm">Nog geen punten om te tonen.</p>;
  }

  const tMin = Math.min(...all.map((p) => p.t));
  const tMaxRaw = Math.max(...all.map((p) => p.t));
  // Met één publicatie is de tijdas nul breed; dan trekken we hem een dag open zodat het punt gecentreerd staat.
  const tMax = tMaxRaw === tMin ? tMin + 86_400_000 : tMaxRaw;
  const yMax = Math.max(1, ...all.map((p) => p.y));

  const x = (t: number) => PAD.left + ((t - tMin) / (tMax - tMin)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - v / yMax) * (H - PAD.top - PAD.bottom);

  const yTicks = [...new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f)))];

  // Alle publicatiemomenten (uniek), gesorteerd, voor het detailpaneel.
  const moments = [...new Set(all.map((p) => p.t))].sort((a, b) => a - b);
  const selected = selectedT === null ? null : {
    t: selectedT,
    rows: series
      .map((s) => ({ label: s.label, point: s.points.find((p) => p.t === selectedT) }))
      .filter((r): r is { label: string; point: { t: number; y: number; rank: number } } => !!r.point),
  };

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {series.map((s, i) => (
          <li key={s.label + i} className={`flex items-center gap-1.5 ${s.highlight ? "text-cyan-300 font-bold" : "text-slate-400"}`}>
            <svg width={22} height={6} aria-hidden="true">
              <line x1={0} x2={22} y1={3} y2={3} stroke={s.highlight ? "#22d3ee" : "#94a3b8"} strokeWidth={s.highlight ? 2.5 : 1.75} strokeDasharray={s.highlight ? "" : DASHES[i % DASHES.length]} />
            </svg>
            {s.label}
          </li>
        ))}
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Puntenverloop over tijd">
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#1e293b" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" className="fill-slate-500" fontSize={11}>{v}</text>
          </g>
        ))}

        <text x={PAD.left} y={H - 8} className="fill-slate-500" fontSize={11}>{fmtDate(tMin)}</text>
        {tMaxRaw !== tMin && (
          <text x={x(tMaxRaw)} y={H - 8} textAnchor="end" className="fill-slate-500" fontSize={11}>{fmtDate(tMaxRaw)}</text>
        )}

        {series.map((s, i) => {
          const color = s.highlight ? "#22d3ee" : "#94a3b8";
          const dash = s.highlight ? "" : DASHES[i % DASHES.length];
          const pts = s.points.map((p) => `${x(p.t)},${y(p.y)}`).join(" ");
          return (
            <g key={s.label + i}>
              {s.points.length > 1 && (
                <polyline points={pts} fill="none" stroke={color} strokeWidth={s.highlight ? 2.5 : 1.75} strokeDasharray={dash} />
              )}
              {s.points.map((p) => (
                <circle key={p.t} cx={x(p.t)} cy={y(p.y)} r={s.highlight ? 3.5 : 2.5} fill={color} />
              ))}
            </g>
          );
        })}

        {/* Onzichtbare, grotere klikvlakken per publicatiemoment, zodat ze ook op mobiel goed te raken zijn. */}
        {moments.map((t) => (
          <g key={`hit-${t}`}>
            <rect
              x={x(t) - 10}
              y={PAD.top}
              width={20}
              height={H - PAD.top - PAD.bottom}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => setSelectedT(t)}
            >
              <title>{fmtDateLong(t)}</title>
            </rect>
            {selectedT === t && (
              <line x1={x(t)} x2={x(t)} y1={PAD.top} y2={H - PAD.bottom} stroke="#22d3ee" strokeWidth={1} strokeDasharray="3 3" />
            )}
          </g>
        ))}
      </svg>

      {selected ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1.5">{fmtDateLong(selected.t)}</p>
          <ul className="space-y-1">
            {selected.rows.map((r) => (
              <li key={r.label} className="flex items-center justify-between gap-3">
                <span className="text-slate-300 truncate">{r.label}</span>
                <span className="shrink-0 text-slate-400">
                  positie <span className="font-semibold text-white">{r.point!.y > 0 ? r.point!.rank : "—"}</span>
                  {" · "}
                  <span className="font-bold text-cyan-400">{r.point!.y} pt</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Klik op een punt in de grafiek voor de datum en de stand op dat moment.</p>
      )}
    </div>
  );
}
