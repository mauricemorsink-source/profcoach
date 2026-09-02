"use client";

import { useState, useEffect, useRef } from "react";

export const TOUR_KEY = "profcoach_tour_seen_v1";
const PAD = 10;
const TOTAL_DELAY = 600; // ms: React render + smooth scroll
const TW = 288;
const TH_ESTIMATE = 195; // eerste gok voor de tooltip-hoogte, vóór de echte meting
const MARGIN = 12;

export interface TourStep {
  target: string;
  title: string;
  body: string;
  tooltipPosition?: "auto" | "fixed-bottom";
}

interface Props {
  steps: TourStep[];
  onDone: () => void;
  onStepEnter?: (index: number) => void;
  onStepLeave?: (index: number) => void;
}

function readRect(target: string): DOMRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  return el ? el.getBoundingClientRect() : null;
}

export default function SpotlightTour({ steps, onDone, onStepEnter, onStepLeave }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [adjustedTop, setAdjustedTop] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Blokkeer gebruikersscroll via wheel + touchmove, maar laat programmatisch scrollen intact
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("wheel", prevent, { passive: false });
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      document.removeEventListener("wheel", prevent);
      document.removeEventListener("touchmove", prevent);
    };
  }, []);

  // Per stap: trigger stap-callback, probeer te scrollen (element bestaat misschien nog niet),
  // wacht altijd TOTAL_DELAY ms zodat React kan renderen én scroll afloopt, dan meten.
  useEffect(() => {
    setRect(null);
    setAdjustedTop(null);
    onStepEnter?.(stepIdx);

    const target = steps[stepIdx].target;

    // Scroll alleen als element al in DOM staat (bij dynamische elementen zoals de picker nog niet)
    const el = document.querySelector(`[data-tour="${target}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });

    const t = setTimeout(() => {
      setRect(readRect(target));
    }, TOTAL_DELAY);

    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  // Resize: opnieuw meten (ook de tooltip zelf, via de rect-wijziging hieronder)
  useEffect(() => {
    const update = () => setRect(readRect(steps[stepIdx].target));
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [stepIdx, steps]);

  function next() {
    onStepLeave?.(stepIdx);
    if (stepIdx < steps.length - 1) {
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

  const currentStep = steps[stepIdx];
  const fixedBottom = currentStep.tooltipPosition === "fixed-bottom";

  const top = (rect?.top ?? 0) - PAD;
  const left = (rect?.left ?? 0) - PAD;
  const w = (rect?.width ?? 0) + PAD * 2;
  const h = (rect?.height ?? 0) + PAD * 2;
  const bottom = top + h;
  const right = left + w;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;

  const tooltipLeft = Math.max(MARGIN, Math.min(left + w / 2 - TW / 2, vw - TW - MARGIN));

  let estimatedTop: number;
  let showBelow: boolean;
  if (fixedBottom) {
    estimatedTop = vh - TH_ESTIMATE - MARGIN;
    showBelow = false;
  } else if (bottom + 14 + TH_ESTIMATE <= vh - MARGIN) {
    estimatedTop = bottom + 14;
    showBelow = true;
  } else if (top - 14 - TH_ESTIMATE >= MARGIN) {
    estimatedTop = top - 14 - TH_ESTIMATE;
    showBelow = false;
  } else {
    estimatedTop = vh - TH_ESTIMATE - MARGIN;
    showBelow = false;
  }

  // De tooltip-hoogte hangt af van de teksten (varieert per stap/schermbreedte) en is dus
  // niet exact TH_ESTIMATE — vooral op mobiel, met meer regeltekst, kan hij hoger uitvallen
  // dan geschat. Zonder correctie zou het onderste stuk (met de knoppen) buiten beeld kunnen
  // vallen. Na het renderen meten we de ECHTE hoogte en schuiven zo nodig bij.
  useEffect(() => {
    if (!rect || !tooltipRef.current) return;
    const measure = () => {
      const el = tooltipRef.current;
      if (!el) return;
      const height = el.getBoundingClientRect().height;
      const viewportH = window.innerHeight;
      let finalTop = estimatedTop;
      if (finalTop + height > viewportH - MARGIN) finalTop = viewportH - MARGIN - height;
      if (finalTop < MARGIN) finalTop = MARGIN;
      setAdjustedTop(finalTop);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect, stepIdx, estimatedTop]);

  const tooltipTop = adjustedTop ?? estimatedTop;
  const arrowLeft = Math.min(Math.max(left + w / 2 - tooltipLeft - 6, 12), TW - 24);

  // Tijdens het meten (elke stapwissel, incl. de eerste) is de positie van het volgende
  // spotlight-doel nog niet bekend. Zonder afdekking zou de onderliggende pagina in dat
  // venster van ~600ms gewoon volledig klikbaar/typbaar zijn — vandaar deze volledige
  // afdekking in plaats van niets renderen.
  if (!rect) return <div className="fixed inset-0 z-[90] bg-black/75" />;

  return (
    <>
      {/* Vier backdrop-vakken rondom het spotlight */}
      <div className="fixed inset-0 z-[90]">
        <div className="absolute bg-black/75" style={{ top: 0, left: 0, right: 0, height: Math.max(0, top) }} />
        <div className="absolute bg-black/75" style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
        <div className="absolute bg-black/75" style={{ top, left: 0, width: Math.max(0, left), height: h }} />
        <div className="absolute bg-black/75" style={{ top, left: right, right: 0, height: h }} />
      </div>

      {/* Klikblokkering in het spotlight-gat — boven picker (z-94) maar onder tooltip (z-96) */}
      <div className="fixed z-[95]" style={{ top, left, width: w, height: h }} />

      {/* Highlight rand */}
      <div
        className="fixed z-[91] rounded-xl border-2 border-cyan-400 pointer-events-none"
        style={{ top, left, width: w, height: h, boxShadow: "0 0 0 3px rgba(34,211,238,0.2)" }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[96] bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl overflow-y-auto"
        style={{ top: tooltipTop, left: tooltipLeft, width: TW, maxHeight: vh - MARGIN * 2, visibility: adjustedTop === null ? "hidden" : "visible" }}
      >
        {!fixedBottom && (
          <div
            className={`absolute w-3 h-3 bg-slate-900 rotate-45 ${
              showBelow
                ? "border-t border-l border-cyan-500/40 -top-1.5"
                : "border-b border-r border-cyan-500/40 -bottom-1.5"
            }`}
            style={{ left: arrowLeft }}
          />
        )}
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-bold text-white">{currentStep.title}</p>
          <span className="text-xs text-slate-500">{stepIdx + 1}/{steps.length}</span>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">{currentStep.body}</p>
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
