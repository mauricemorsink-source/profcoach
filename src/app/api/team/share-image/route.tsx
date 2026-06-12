import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const POSITION_LABEL: Record<string, string> = {
  GK: "DM", DEF: "VER", MID: "MID", ATT: "AAN",
};

const CLUB_LABEL: Record<string, string> = {
  ONE: "Rietmolen 1", TWO: "Rietmolen 2", THREE: "Rietmolen 3",
  FOUR: "Rietmolen 4", FIVE: "Rietmolen 5", DAMES: "Rietmolen VR1",
};

const POS_ORDER = ["GK", "DEF", "MID", "ATT"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamEntryId = searchParams.get("teamEntryId");
  if (!teamEntryId) return new Response("Missing teamEntryId", { status: 400 });

  const entry = await prisma.teamEntry.findUnique({
    where: { id: teamEntryId },
    include: {
      season: { select: { name: true } },
      formation: { select: { code: true } },
      players: {
        include: { player: true },
        orderBy: { slotIndex: "asc" },
      },
      prediction: {
        include: {
          topScorer: { select: { name: true } },
          assistKoning: { select: { name: true } },
        },
      },
    },
  });

  if (!entry) return new Response("Niet gevonden", { status: 404 });

  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  const captainEnabled = settings?.captainEnabled ?? false;

  const sortedPlayers = [...entry.players].sort(
    (a, b) => POS_ORDER.indexOf(a.player.position) - POS_ORDER.indexOf(b.player.position)
  );

  const pred = entry.prediction;

  return new ImageResponse(
    (
      <div
        style={{
          width: "600px",
          backgroundColor: "#060b14",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          padding: "0",
        }}
      >
        {/* Cyan top bar */}
        <div style={{ height: "4px", background: "linear-gradient(90deg,#22d3ee,#0891b2)", width: "100%" }} />

        {/* Header */}
        <div style={{ padding: "24px 28px 16px", display: "flex", flexDirection: "column", gap: "6px", borderBottom: "1px solid #1e3a5a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff" }}>Profcoach Rietmolen</span>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#22d3ee" }}>{entry.season.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.3)",
              borderRadius: "6px",
              padding: "2px 10px",
              fontSize: "12px",
              color: "#22d3ee",
              fontWeight: "600",
            }}>
              {entry.formation?.code ?? ""}
            </div>
            <span style={{ fontSize: "12px", color: "#475569" }}>
              {sortedPlayers.length} spelers geselecteerd
            </span>
          </div>
        </div>

        {/* Team label row */}
        <div style={{ display: "flex", padding: "10px 28px 6px", gap: "0" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", flex: "1" }}>Naam</span>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", width: "48px", textAlign: "center" }}>Pos.</span>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", width: "120px" }}>Elftal</span>
        </div>

        {/* Player rows */}
        <div style={{ display: "flex", flexDirection: "column", padding: "0 28px" }}>
          {sortedPlayers.map((tp, i) => {
            const isCaptain = captainEnabled && entry.captainSlot === tp.slotIndex;
            return (
              <div key={tp.slotIndex} style={{
                display: "flex",
                alignItems: "center",
                padding: "7px 0",
                borderBottom: i < sortedPlayers.length - 1 ? "1px solid rgba(30,58,90,0.6)" : "none",
                background: i % 2 === 0 ? "transparent" : "rgba(15,32,56,0.4)",
              }}>
                <span style={{ flex: "1", fontSize: "13px", color: "#e2e8f0", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                  {tp.player.name}
                  {isCaptain && (
                    <span style={{
                      fontSize: "10px", fontWeight: "800", color: "#f59e0b",
                      background: "rgba(245,158,11,0.15)",
                      border: "1px solid rgba(245,158,11,0.4)",
                      borderRadius: "4px", padding: "1px 5px",
                    }}>C</span>
                  )}
                </span>
                <span style={{ width: "48px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                  {POSITION_LABEL[tp.player.position] ?? tp.player.position}
                </span>
                <span style={{ width: "120px", fontSize: "12px", color: "#64748b" }}>
                  {CLUB_LABEL[tp.player.clubTeam] ?? tp.player.clubTeam}
                </span>
              </div>
            );
          })}
        </div>

        {/* Predictions */}
        {pred && (
          <>
            <div style={{ margin: "16px 28px 0", borderTop: "1px solid #1e3a5a", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "0" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
                Voorspellingen
              </span>
              {[
                { label: "Topscorer", value: pred.topScorer?.name ?? "—" },
                { label: "Assistkoning", value: pred.assistKoning?.name ?? "—" },
                { label: "Gele kaarten", value: pred.totalYellowCards != null ? String(pred.totalYellowCards) : "—" },
                { label: "Totaal doelpunten", value: pred.totalGoals != null ? String(pred.totalGoals) : "—" },
              ].map((row, i) => (
                <div key={row.label} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: i < 3 ? "1px solid rgba(30,58,90,0.4)" : "none",
                }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{row.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: row.value === "—" ? "400" : "600", color: row.value === "—" ? "#334155" : "#e2e8f0" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ margin: "16px 28px 20px", display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: "10px", color: "#1e3a5a" }}>profcoach.rietmolen.nl</span>
        </div>
      </div>
    ),
    {
      width: 600,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    }
  );
}
