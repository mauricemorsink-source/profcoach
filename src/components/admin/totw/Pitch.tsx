import type { TotWResult, TotWPlayer } from "./types";
import { TEAM_SHORT } from "./constants";
import { Shirt } from "./Shirt";
import { EmptyShirt } from "./EmptyShirt";

export function Pitch({ totw, title, subtitle }: { totw: TotWResult; title: string; subtitle: string }) {
  const { formation, players } = totw;
  const rows: { pos: string; count: number; yPct: number }[] = [
    { pos: "ATT", count: formation.attackers,  yPct: 20 },
    { pos: "MID", count: formation.midfielders, yPct: 40 },
    { pos: "DEF", count: formation.defenders,   yPct: 62 },
    { pos: "GK",  count: 1,                     yPct: 82 },
  ];

  const byPos: Record<string, TotWPlayer[]> = { GK: [], DEF: [], MID: [], ATT: [] };
  for (const p of players) byPos[p.position]?.push(p);

  const slots: { player: TotWPlayer | null; xPct: number; yPct: number }[] = [];
  for (const row of rows) {
    const rowPlayers = byPos[row.pos] ?? [];
    for (let i = 0; i < row.count; i++) {
      slots.push({
        player: rowPlayers[i] ?? null,
        xPct: ((i + 1) / (row.count + 1)) * 100,
        yPct: row.yPct,
      });
    }
  }

  const formationLabel = `${formation.defenders}-${formation.midfielders}-${formation.attackers}`;

  return (
    <div
      className="relative rounded-2xl overflow-hidden select-none"
      style={{
        background: "linear-gradient(180deg, #0a2e0a 0%, #1b5e1b 50%, #0a2e0a 100%)",
        aspectRatio: "3/4",
        maxWidth: "420px",
        width: "100%",
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 300 400"
        preserveAspectRatio="xMidYMid meet"
        style={{ opacity: 0.22 }}
      >
        <rect x="18" y="18" width="264" height="364" fill="none" stroke="white" strokeWidth="2" />
        <line x1="18" y1="200" x2="282" y2="200" stroke="white" strokeWidth="1.5" />
        <circle cx="150" cy="200" r="44" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="150" cy="200" r="3" fill="white" />
        <rect x="82" y="18" width="136" height="64" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="82" y="318" width="136" height="64" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="116" y="18" width="68" height="26" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="116" y="356" width="68" height="26" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="150" cy="65" r="2.5" fill="white" />
        <circle cx="150" cy="335" r="2.5" fill="white" />
      </svg>

      {/* Title */}
      <div className="absolute top-0 left-0 right-0 py-2.5 text-center z-10" style={{ background: "rgba(0,0,0,0.52)" }}>
        <div className="text-white font-black text-sm tracking-[0.16em] drop-shadow uppercase">
          {title || "Team of the Week"}
        </div>
        {subtitle && (
          <div className="text-blue-300 text-[10px] font-semibold tracking-widest uppercase mt-0.5">
            {subtitle}
          </div>
        )}
      </div>

      {/* Players */}
      {slots.map(({ player, xPct, yPct }, i) => (
        <div
          key={i}
          className="absolute flex flex-col items-center z-10"
          style={{ left: `${xPct}%`, top: `${yPct}%`, transform: "translate(-50%, -50%)" }}
        >
          {player ? <Shirt /> : <EmptyShirt />}
          <div className="text-center mt-0.5" style={{ width: "72px" }}>
            <div
              className="text-white text-[9px] font-bold leading-tight text-center break-words"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
            >
              {player ? player.name : "—"}
            </div>
            {player && (
              <div className="text-blue-200 text-[8px] font-semibold" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}>
                {TEAM_SHORT[player.clubTeam] ?? ""}
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="absolute bottom-1.5 right-2.5 text-[10px] font-bold z-10" style={{ color: "rgba(255,255,255,0.28)" }}>
        {formationLabel}
      </div>
    </div>
  );
}
