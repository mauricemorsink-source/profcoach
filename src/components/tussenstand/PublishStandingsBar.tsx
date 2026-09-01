"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublishStandingsBar({ publishedStandingsAt }: { publishedStandingsAt: Date | null }) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const publishedLabel = publishedStandingsAt
    ? new Date(publishedStandingsAt).toLocaleString("nl-NL", {
        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam",
      })
    : null;

  async function publish() {
    setPublishing(true);
    setError("");
    const res = await fetch("/api/admin/standings/publish", { method: "POST" });
    setPublishing(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Publiceren mislukt");
      return;
    }
    router.refresh();
  }

  return (
    <div className="bg-slate-900 neon-border rounded-2xl p-4 flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wide">Admin — live stand</p>
        <p className="text-sm text-slate-400 mt-0.5">
          {publishedLabel
            ? `Deelnemers zien de stand van ${publishedLabel}`
            : "Nog niet gepubliceerd — deelnemers zien niets."}
        </p>
      </div>
      <button
        onClick={publish}
        disabled={publishing}
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors neon-glow-sm"
      >
        {publishing ? "Bezig..." : "Publiceer huidige stand"}
      </button>
      {error && <p className="text-red-400 text-xs w-full">{error}</p>}
    </div>
  );
}
