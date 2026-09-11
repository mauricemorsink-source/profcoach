"use client";

import { useState } from "react";
import type { Match, Formation, TotWResult } from "./totw/types";
import { drawPitchCanvas } from "./totw/canvasDrawing";
import { ConfigModal } from "./totw/ConfigModal";
import { MatchSelector } from "./totw/MatchSelector";
import { TotwResultView } from "./totw/TotwResultView";

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
          <MatchSelector
            sortedGroups={sortedGroups}
            selectedMatchIds={selectedMatchIds}
            toggleMatch={toggleMatch}
            toggleGroup={toggleGroup}
          />

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
            <TotwResultView totw={totw} title={title} subtitle={subtitle} onDownload={downloadImage} />
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
