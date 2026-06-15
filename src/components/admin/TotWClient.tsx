"use client";

import { useState } from "react";

type Match = {
  id: string;
  name: string;
  matchDate: string;
  clubTeam: string;
  publishMoment: { label: string } | null;
};

type Formation = {
  code: string;
  defenders: number;
  midfielders: number;
  attackers: number;
};

type TotWPlayer = {
  playerId: string;
  name: string;
  shortName: string | null;
  position: string;
  clubTeam: string;
  points: number;
};

type TotWResult = {
  formation: Formation;
  players: TotWPlayer[];
};

const TEAM_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};
const TEAM_SHORT: Record<string, string> = {
  ONE: "R1", TWO: "R2", THREE: "R3", FOUR: "R4", FIVE: "R5", DAMES: "VR1",
};

// --- Canvas drawing ---

function canvasDrawShirt(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  width: number,
  filled: boolean
) {
  const scale = width / 44;
  const px = (x: number) => cx - width / 2 + x * scale;
  const py = (y: number) => topY + y * scale;

  ctx.beginPath();
  ctx.moveTo(px(18), py(3));
  ctx.lineTo(px(5), py(9));
  ctx.lineTo(px(3), py(20));
  ctx.lineTo(px(13), py(18));
  ctx.lineTo(px(13), py(45));
  ctx.lineTo(px(31), py(45));
  ctx.lineTo(px(31), py(18));
  ctx.lineTo(px(41), py(20));
  ctx.lineTo(px(39), py(9));
  ctx.lineTo(px(26), py(3));
  ctx.quadraticCurveTo(px(22), py(9), px(18), py(3));
  ctx.closePath();

  if (filled) {
    ctx.fillStyle = "#1d4ed8";
    ctx.fill();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px(18), py(3));
    ctx.quadraticCurveTo(px(22), py(9), px(26), py(3));
    ctx.fillStyle = "#1e3a8a";
    ctx.fill();
    ctx.strokeStyle = "#93c5fd";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fill();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawPitchCanvas(
  ctx: CanvasRenderingContext2D,
  totw: TotWResult,
  title: string,
  subtitle: string
) {
  const W = 1080;
  const H = 1080;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0a2e0a");
  bg.addColorStop(0.5, "#1b5e1b");
  bg.addColorStop(1, "#0a2e0a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Pitch markings
  const PX = 40, PY = 148, PW = 1000, PH = 910;
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.strokeRect(PX, PY, PW, PH);
  ctx.beginPath();
  ctx.moveTo(PX, PY + PH / 2);
  ctx.lineTo(PX + PW, PY + PH / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(PX + PW / 2, PY + PH / 2, 78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(PX + 180, PY, 640, 160);
  ctx.strokeRect(PX + 320, PY, 360, 64);
  ctx.strokeRect(PX + 180, PY + PH - 160, 640, 160);
  ctx.strokeRect(PX + 320, PY + PH - 64, 360, 64);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.arc(PX + PW / 2, PY + PH / 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(PX + PW / 2, PY + 112, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(PX + PW / 2, PY + PH - 112, 3, 0, Math.PI * 2);
  ctx.fill();

  // Title bar
  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.fillRect(0, 0, W, 140);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = `bold 46px system-ui, -apple-system, Arial, sans-serif`;
  ctx.fillText((title || "TEAM OF THE WEEK").toUpperCase(), W / 2, 55);

  ctx.fillStyle = "#93c5fd";
  ctx.font = `600 24px system-ui, -apple-system, Arial, sans-serif`;
  ctx.fillText(subtitle || "", W / 2, 104);

  // Players
  const { formation, players } = totw;
  const rows: { pos: string; count: number; yCenter: number }[] = [
    { pos: "ATT", count: formation.attackers,  yCenter: PY + PH * 0.15 },
    { pos: "MID", count: formation.midfielders, yCenter: PY + PH * 0.37 },
    { pos: "DEF", count: formation.defenders,   yCenter: PY + PH * 0.60 },
    { pos: "GK",  count: 1,                     yCenter: PY + PH * 0.81 },
  ];

  const byPos: Record<string, TotWPlayer[]> = { GK: [], DEF: [], MID: [], ATT: [] };
  for (const p of players) byPos[p.position]?.push(p);

  const SHIRT_W = 86;
  const SHIRT_H = SHIRT_W * (48 / 44);

  for (const row of rows) {
    const rowPlayers = byPos[row.pos] ?? [];
    for (let i = 0; i < row.count; i++) {
      const player = rowPlayers[i] ?? null;
      const xCenter = PX + ((i + 1) / (row.count + 1)) * PW;
      const shirtTopY = row.yCenter - SHIRT_H / 2;

      canvasDrawShirt(ctx, xCenter, shirtTopY, SHIRT_W, player !== null);

      const nameY = shirtTopY + SHIRT_H + 22;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      if (player) {
        ctx.fillStyle = "white";
        ctx.font = `bold 19px system-ui, -apple-system, Arial, sans-serif`;
        ctx.fillText(player.name, xCenter, nameY, 200);

        ctx.fillStyle = "#93c5fd";
        ctx.font = `600 14px system-ui, -apple-system, Arial, sans-serif`;
        ctx.fillText(TEAM_SHORT[player.clubTeam] ?? "", xCenter, nameY + 26);
      }
    }
  }

  // Formation label
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font = `bold 18px system-ui`;
  ctx.fillText(
    `${formation.defenders}-${formation.midfielders}-${formation.attackers}`,
    W - 18,
    H - 14
  );
}

// --- React components ---

function Shirt() {
  return (
    <svg width="44" height="48" viewBox="0 0 44 48" fill="none">
      <path
        d="M18 3 L5 9 L3 20 L13 18 L13 45 L31 45 L31 18 L41 20 L39 9 L26 3 Q22 9 18 3 Z"
        fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5"
      />
      <path d="M18 3 Q22 9 26 3" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.5" />
    </svg>
  );
}

function EmptyShirt() {
  return (
    <svg width="44" height="48" viewBox="0 0 44 48" fill="none">
      <path
        d="M18 3 L5 9 L3 20 L13 18 L13 45 L31 45 L31 18 L41 20 L39 9 L26 3 Q22 9 18 3 Z"
        fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="4 3"
      />
    </svg>
  );
}

function Pitch({ totw, title, subtitle }: { totw: TotWResult; title: string; subtitle: string }) {
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

function ConfigModal({
  formations,
  title,
  subtitle,
  selectedFormation,
  loading,
  error,
  onTitleChange,
  onSubtitleChange,
  onFormationChange,
  onConfirm,
  onClose,
}: {
  formations: Formation[];
  title: string;
  subtitle: string;
  selectedFormation: Formation | null;
  loading: boolean;
  error: string | null;
  onTitleChange: (v: string) => void;
  onSubtitleChange: (v: string) => void;
  onFormationChange: (f: Formation) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const INPUT = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors";
  const LABEL = "block text-sm font-medium text-slate-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div className="bg-slate-900 neon-border rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Configureer Team of the Week</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        <div>
          <label className={LABEL}>Titel</label>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Team of the Week"
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL}>Subtitel</label>
          <input
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="Speelronde 1"
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL}>Formatie</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {formations.map((f) => {
              const label = `${f.defenders}-${f.midfielders}-${f.attackers}`;
              const active = selectedFormation?.code === f.code;
              return (
                <button
                  key={f.code}
                  onClick={() => onFormationChange(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                    active
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                      : "text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-sm px-3 py-2 rounded-lg bg-red-900/20 text-red-400 border border-red-500/30">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onConfirm}
            disabled={loading || !selectedFormation}
            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors"
          >
            {loading ? "Laden..." : "Genereer elftal"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg text-sm font-medium transition-colors"
          >
            Annuleer
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main export ---

export default function TotWClient({
  matches,
  formations,
}: {
  matches: Match[];
  formations: Formation[];
}) {
  const defaultFormation = formations.find((f) => f.code === "433") ?? formations[0] ?? null;

  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("Team of the Week");
  const [subtitle, setSubtitle] = useState("Speelronde");
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(defaultFormation);
  const [totw, setTotw] = useState<TotWResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group by match date (day)
  const groups = new Map<string, { label: string; sortKey: string; matches: Match[] }>();
  for (const match of matches) {
    const d = new Date(match.matchDate);
    const sortKey = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    if (!groups.has(sortKey)) groups.set(sortKey, { label, sortKey, matches: [] });
    groups.get(sortKey)!.matches.push(match);
  }
  const sortedGroups = Array.from(groups.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  function toggleMatch(id: string) {
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setTotw(null);
  }

  function toggleGroup(groupMatches: Match[]) {
    const allSelected = groupMatches.every((m) => selectedMatchIds.has(m.id));
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      if (allSelected) groupMatches.forEach((m) => next.delete(m.id));
      else groupMatches.forEach((m) => next.add(m.id));
      return next;
    });
    setTotw(null);
  }

  async function generate() {
    if (selectedMatchIds.size === 0 || !selectedFormation) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/totw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchIds: Array.from(selectedMatchIds),
          formationCode: selectedFormation.code,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Er is een fout opgetreden");
      } else {
        setTotw(data);
        setModalOpen(false);
      }
    } catch {
      setError("Verbindingsfout");
    } finally {
      setLoading(false);
    }
  }

  function downloadImage() {
    if (!totw) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawPitchCanvas(ctx, totw, title, subtitle);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "team-of-the-week.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="max-w-4xl space-y-5">
      <h1 className="text-xl font-black text-white">Team of the Week</h1>

      {matches.length === 0 ? (
        <div className="bg-slate-900 neon-border rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm">Nog geen verwerkte wedstrijden beschikbaar.</p>
        </div>
      ) : (
        <>
          {/* Match selection */}
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

          {/* Generate button */}
          <button
            onClick={() => setModalOpen(true)}
            disabled={selectedMatchIds.size === 0}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-40 font-semibold text-sm transition-colors"
          >
            Genereer Team of the Week
          </button>

          {/* TOTW result */}
          {totw && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold">{title}</h2>
                  {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
                </div>
                <button
                  onClick={downloadImage}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium border border-slate-700 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                    <path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download PNG
                </button>
              </div>

              <Pitch totw={totw} title={title} subtitle={subtitle} />

              {/* Player overview */}
              <div className="bg-slate-900 neon-border rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Selectie</p>
                <div className="space-y-1.5">
                  {totw.players.map((p) => (
                    <div key={p.playerId} className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500 w-8 text-xs shrink-0">{p.position}</span>
                      <span className="text-white font-medium flex-1">{p.name}</span>
                      <span className="text-slate-400 text-xs">{TEAM_LABEL[p.clubTeam] ?? p.clubTeam}</span>
                      <span className="text-cyan-400 font-bold w-14 text-right shrink-0">{p.points} pt</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Config modal */}
      {modalOpen && (
        <ConfigModal
          formations={formations}
          title={title}
          subtitle={subtitle}
          selectedFormation={selectedFormation}
          loading={loading}
          error={error}
          onTitleChange={setTitle}
          onSubtitleChange={setSubtitle}
          onFormationChange={setSelectedFormation}
          onConfirm={generate}
          onClose={() => { setModalOpen(false); setError(null); }}
        />
      )}
    </div>
  );
}
