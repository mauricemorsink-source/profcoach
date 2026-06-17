"use client";

import { useState, useEffect } from "react";

export const TOUR_KEY = "profcoach_tour_seen_v1";
const PAD = 10;

export interface TourStep {
  target: string;
  title: string;
  body: string;
}

interface Props {
  steps: TourStep[];
  onDone: () => void;
  onStepEnter?: (index: number) => void;
  onStepLeave?: (index: number) => void;
}

function getElementRect(target: string): DOMRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  return el.getBoundingClientRect();
}

export default function SpotlightTour({ steps, onDone, onStepEnter, onStepLeave }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Scrollblokkering
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Step enter + rect ophalen
  useEffect(() => {
    onStepEnter?.(stepIdx);

    let frame: number;
    const t1 = setTimeout(() => {
      setRect(getElementRect(steps[stepIdx].target));
      frame = requestAnimationFrame(() => {
        const t2 = setTimeout(() => {
          setRect(getElementRect(steps[stepIdx].target));
        }, 350);
        return () => clearTimeout(t2);
      });
    }, 60);

    return () => { clearTimeout(t1); cancelAnimationFrame(frame); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  // Resize
  useEffect(() => {
    const update = () => setRect(getElementRect(steps[stepIdx].target));
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [stepIdx, steps]);

  function next() {
    onStepLeave?.(stepIdx);
    if (stepIdx < steps.length - 1) {
      setRect(null);
      setStepIdx((i) => i + 1);
    } else {
      finish();
    }
  }

  function finish() {
    onStepLeave?.(stepIdx);
    localStorage.setItem(TOUR_KEY, "1");
    onDone();
  }

  if (!rect) return null;

  const top = rect.top - PAD;
  const left = rect.left - PAD;
  const w = rect.width + PAD * 2;
  const h = rect.height + PAD * 2;
  const bottom = top + h;
  const right = left + w;
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  // Tooltip afmetingen (geschat)
  const TW = 288; // w-72
  const TH = 190;
  const MARGIN = 10;

  // Horizontaal: gecentreerd op het spotlight-element, geklemd binnen viewport
  const tooltipLeft = Math.max(MARGIN, Math.min(left + w / 2 - TW / 2, vw - TW - MARGIN));

  // Verticaal: liever onder, anders boven, anders zo laag mogelijk
  let tooltipTop: number;
  let showBelow: boolean;
  if (bottom + 14 + TH <= vh - MARGIN) {
    tooltipTop = bottom + 14;
    showBelow = true;
  } else if (top - 14 - TH >= MARGIN) {
    tooltipTop = top - 14 - TH;
    showBelow = false;
  } else {
    // Geen ruimte boven of onder: toon onderaan het scherm
    tooltipTop = vh - TH - MARGIN;
    showBelow = false;
  }

  // Pijltje: positie relatief aan tooltip
  const arrowLeft = Math.min(Math.max(left + w / 2 - tooltipLeft - 6, 12), TW - 24);

  return (
    <>
      {/* Vier backdrop-vakken (blokkeren klikken én zicht) */}
      <div className="fixed inset-0 z-[90]">
        <div className="absolute bg-black/75" style={{ top: 0, left: 0, right: 0, height: Math.max(0, top) }} />
        <div className="absolute bg-black/75" style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
        <div className="absolute bg-black/75" style={{ top, left: 0, width: Math.max(0, left), height: h }} />
        <div className="absolute bg-black/75" style={{ top, left: right, right: 0, height: h }} />
        {/* Transparante klikblokkering over het spotlight-gat */}
        <div className="absolute" style={{ top, left, width: w, height: h }} />
      </div>

      {/* Highlight rand */}
      <div
        className="fixed z-[91] rounded-xl border-2 border-cyan-400 pointer-events-none"
        style={{ top, left, width: w, height: h, boxShadow: "0 0 0 3px rgba(34,211,238,0.2)" }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[96] bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl"
        style={{ top: tooltipTop, left: tooltipLeft, width: TW }}
      >
        {/* Pijltje */}
        <div
          className={`absolute w-3 h-3 bg-slate-900 rotate-45 ${showBelow ? "border-t border-l border-cyan-500/40 -top-1.5" : "border-b border-r border-cyan-500/40 -bottom-1.5"}`}
          style={{ left: arrowLeft }}
        />
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-bold text-white">{steps[stepIdx].title}</p>
          <span className="text-xs text-slate-500">{stepIdx + 1}/{steps.length}</span>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">{steps[stepIdx].body}</p>
        <div className="flex items-center justify-between">
          <button onClick={finish} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Overslaan
          </button>
          <button
            onClick={next}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-colors neon-glow-sm"
          >
            {stepIdx < steps.length - 1 ? "Volgende →" : "Klaar!"}
          </button>
        </div>
      </div>
    </>
  );
}
