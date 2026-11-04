"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Naam = { id: string; userName: string };

const MAX_COMPARE = 4;
const MAX_HITS = 8;

function hrefFor(ids: string[]) {
  return ids.length ? `/tussenstand/vergelijken?ids=${ids.join(",")}` : "/tussenstand/vergelijken";
}

/** Zoeken op naam, zoals op de stand-pagina. Er worden alleen gevonden namen getoond, nooit de hele lijst. */
export default function VergelijkKiezer({
  deelnemers,
  selected,
}: {
  deelnemers: Naam[];
  selected: Naam[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const selectedIds = selected.map((d) => d.id);
  const q = query.trim().toLowerCase();
  const hits = q
    ? deelnemers.filter((d) => !selectedIds.includes(d.id) && d.userName.toLowerCase().includes(q)).slice(0, MAX_HITS)
    : [];
  const full = selected.length >= MAX_COMPARE;

  function add(id: string) {
    if (full) return;
    setQuery("");
    router.replace(hrefFor([...selectedIds, id]), { scroll: false });
  }

  function remove(id: string) {
    router.replace(hrefFor(selectedIds.filter((x) => x !== id)), { scroll: false });
  }

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((d) => (
            <span key={d.id} className="inline-flex items-center gap-1.5 text-sm pl-3 pr-1.5 py-1 rounded-lg border bg-cyan-900/40 text-cyan-300 border-cyan-500/40">
              {d.userName}
              <button
                type="button"
                onClick={() => remove(d.id)}
                aria-label={`${d.userName} verwijderen`}
                className="px-1.5 text-cyan-400 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {full ? (
        <p className="text-slate-500 text-xs">Je kunt maximaal {MAX_COMPARE} deelnemers vergelijken. Verwijder er een om een ander toe te voegen.</p>
      ) : (
        <>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op naam om toe te voegen..."
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors"
          />
          {q && hits.length === 0 && <p className="text-slate-500 text-xs">Geen deelnemers gevonden voor &quot;{query}&quot;.</p>}
          {hits.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {hits.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => add(d.id)}
                    className="text-sm px-3 py-1.5 rounded-lg border bg-slate-800/50 text-slate-300 border-slate-700 hover:text-white hover:border-cyan-500/40 transition-colors"
                  >
                    + {d.userName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
