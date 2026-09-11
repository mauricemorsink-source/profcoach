import type { TotWResult, TotWPlayer } from "./types";
import { TEAM_SHORT } from "./constants";

export function canvasDrawShirt(
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

export function drawPitchCanvas(
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
