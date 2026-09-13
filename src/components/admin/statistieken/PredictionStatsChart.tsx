type Props = {
  title: string;
  unit: string;
  guesses: number[];
  actual: number | null;
  correctMin: number | null;
  correctMax: number | null;
};

type Bin = { from: number; to: number; count: number };

function average(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function buildHistogram(values: number[], min: number, max: number, maxBins = 9): Bin[] {
  const range = max - min + 1;
  const binWidth = range <= maxBins ? 1 : Math.ceil(range / maxBins);
  const binCount = Math.ceil(range / binWidth);
  const bins: Bin[] = Array.from({ length: binCount }, (_, i) => {
    const from = min + i * binWidth;
    return { from, to: from + binWidth - 1, count: 0 };
  });
  for (const v of values) {
    const idx = Math.min(binCount - 1, Math.floor((v - min) / binWidth));
    bins[idx].count++;
  }
  return bins;
}

export default function PredictionStatsChart({ title, unit, guesses, actual, correctMin, correctMax }: Props) {
  if (guesses.length === 0) {
    return (
      <div className="bg-slate-900 neon-border rounded-2xl p-5">
        <h3 className="font-bold text-sm uppercase tracking-wide text-slate-400 mb-3">{title}</h3>
        <p className="text-slate-500 text-sm">Nog geen voorspellingen ingevuld.</p>
      </div>
    );
  }

  const min = Math.min(...guesses);
  const max = Math.max(...guesses);
  const avg = average(guesses);
  const med = median(guesses);
  const bins = buildHistogram(guesses, min, max);
  const maxCount = Math.max(...bins.map((b) => b.count));

  // Layout: viewBox is a fixed logical grid, scaled responsively via width=100%.
  const W = 640;
  const H = 200;
  const marginLeft = 8;
  const marginRight = 8;
  const marginBottom = 34;
  const marginTop = 28;
  const chartW = W - marginLeft - marginRight;
  const chartH = H - marginTop - marginBottom;
  const gap = 3;
  const barW = (chartW - gap * (bins.length - 1)) / bins.length;

  // Domein loopt door tot max+1 (exclusief), zodat het overeenkomt met hoe bins zijn opgebouwd.
  const domainMin = min;
  const domainMax = max + 1;
  const valueToX = (v: number) => {
    const clamped = Math.max(domainMin, Math.min(domainMax, v));
    return marginLeft + ((clamped - domainMin) / (domainMax - domainMin)) * chartW;
  };

  const showActual = actual !== null && actual >= domainMin - (domainMax - domainMin) * 0.15 && actual <= domainMax + (domainMax - domainMin) * 0.15;
  const showBand = correctMin !== null && correctMax !== null;

  return (
    <div className="bg-slate-900 neon-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <h3 className="font-bold text-sm uppercase tracking-wide text-slate-400">{title}</h3>
        <span className="text-xs text-slate-500">{guesses.length} voorspelling{guesses.length !== 1 ? "en" : ""}</span>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3 text-xs">
        <span className="text-slate-500">Gemiddeld <span className="text-white font-semibold">{avg.toFixed(1)}</span></span>
        <span className="text-slate-500">Mediaan <span className="text-white font-semibold">{med}</span></span>
        <span className="text-slate-500">Laagste <span className="text-white font-semibold">{min}</span></span>
        <span className="text-slate-500">Hoogste <span className="text-white font-semibold">{max}</span></span>
        {actual !== null && (
          <span className="text-slate-500">Werkelijk <span className="text-amber-400 font-semibold">{actual}</span></span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Verdeling van voorspellingen voor ${title.toLowerCase()}`}>
        {/* Correcte-antwoord-band (indien ingesteld) */}
        {showBand && (
          <rect
            x={valueToX(correctMin!)}
            y={marginTop}
            width={Math.max(1, valueToX(correctMax! + 1) - valueToX(correctMin!))}
            height={chartH}
            fill="rgba(34,197,94,0.12)"
            stroke="rgba(34,197,94,0.35)"
            strokeWidth={1}
          />
        )}

        {/* Baseline */}
        <line x1={marginLeft} y1={marginTop + chartH} x2={W - marginRight} y2={marginTop + chartH} stroke="rgba(148,163,184,0.25)" strokeWidth={1} />

        {/* Bars */}
        {bins.map((bin, i) => {
          const barH = maxCount > 0 ? (bin.count / maxCount) * (chartH - 18) : 0;
          const x = marginLeft + i * (barW + gap);
          const y = marginTop + chartH - barH;
          const rangeLabel = bin.from === bin.to ? `${bin.from}` : `${bin.from}-${bin.to}`;
          return (
            <g key={i}>
              {bin.count > 0 && (
                <rect x={x} y={y} width={barW} height={barH} rx={3} ry={3} fill="#22d3ee" fillOpacity={0.85}>
                  <title>{`${bin.count} deelnemer${bin.count !== 1 ? "s" : ""} gokte${bin.count !== 1 ? "n" : ""} ${rangeLabel} ${unit}`}</title>
                </rect>
              )}
              {bin.count > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={11} fontWeight={700} fill="#e2e8f0">
                  {bin.count}
                </text>
              )}
              <text x={x + barW / 2} y={marginTop + chartH + 16} textAnchor="middle" fontSize={10} fill="#64748b">
                {rangeLabel}
              </text>
            </g>
          );
        })}

        {/* Werkelijke uitkomst */}
        {showActual && (
          <>
            <line
              x1={valueToX(actual!)} y1={marginTop - 6} x2={valueToX(actual!)} y2={marginTop + chartH}
              stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3"
            />
            <text x={valueToX(actual!)} y={marginTop - 10} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fbbf24">
              werkelijk: {actual}
            </text>
          </>
        )}
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-400/85 inline-block" /> Aantal voorspellingen</span>
        {showBand && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/30 border border-green-500/50 inline-block" /> Puntengevend bereik ({correctMin}–{correctMax})</span>}
        {showActual && <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> Werkelijke uitkomst</span>}
      </div>
    </div>
  );
}
