"use client";

import { useState, useEffect } from "react";

export const TOUR_KEY = "profcoach_tour_seen_v1";
const PAD = 10;

const STEPS = [
  {
    target: "tour-validation",
    title: "Budget & teamregels",
    body: "Hier zie je direct of je team aan alle eisen voldoet: 11 spelers, binnen budget, en minimaal 1 speler per elftal (max 2). Alles groen? Dan mag je verder.",
  },
  {
    target: "tour-pitch",
    title: "Speler toevoegen",
    body: "Klik op een positie op het veld om een speler te kiezen. Je kunt zoeken op naam of elftal. Al gekozen spelers zie je staan op het veld.",
  },
  {
    target: "tour-next",
    title: "Naar de volgende stap",
    body: "Zodra alle regels groen zijn is deze knop actief. Klik hier om door te gaan met je inschrijving.",
  },
];

function getElementRect(target: string): DOMRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  return el.getBoundingClientRect();
}

interface Props {
  onDone: () => void;
}

export default function SpotlightTour({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let frame: number;

    function update() {
      const r = getElementRect(STEPS[step].target);
      setRect(r);
    }

    // Small delay to allow scroll to settle
    const timeout = setTimeout(() => {
      update();
      // Recheck after scroll animation (~300ms)
      frame = requestAnimationFrame(() => {
        setTimeout(update, 320);
      });
    }, 50);

    window.addEventListener("resize", update);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };
  }, [step]);

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  }

  function finish() {
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

  const showBelow = bottom + 200 < vh;
  const tooltipLeft = Math.max(12, Math.min(left, vw - 312));

  return (
    <>
      {/* Vier backdrop-vakken rondom het spotlight */}
      <div className="fixed inset-0 z-[90] pointer-events-none">
        {/* boven */}
        <div className="absolute bg-black/75" style={{ top: 0, left: 0, right: 0, height: Math.max(0, top) }} />
        {/* onder */}
        <div className="absolute bg-black/75" style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
        {/* links */}
        <div className="absolute bg-black/75" style={{ top, left: 0, width: Math.max(0, left), height: h }} />
        {/* rechts */}
        <div className="absolute bg-black/75" style={{ top, left: right, right: 0, height: h }} />
      </div>

      {/* Highlight rand */}
      <div
        className="fixed z-[91] rounded-xl border-2 border-cyan-400 pointer-events-none"
        style={{ top, left, width: w, height: h, boxShadow: "0 0 0 3px rgba(34,211,238,0.2)" }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[92] w-72 bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl"
        style={showBelow ? { top: bottom + 14, left: tooltipLeft } : { bottom: vh - top + 14, left: tooltipLeft }}
      >
        {/* Pijltje */}
        <div
          className={`absolute w-3 h-3 bg-slate-900 border-cyan-500/40 rotate-45 ${showBelow ? "border-t border-l -top-1.5" : "border-b border-r -bottom-1.5"}`}
          style={{ left: Math.min(Math.max(left - tooltipLeft + w / 2 - 6, 16), 248) }}
        />
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-bold text-white">{STEPS[step].title}</p>
          <span className="text-xs text-slate-500">{step + 1}/{STEPS.length}</span>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">{STEPS[step].body}</p>
        <div className="flex items-center justify-between">
          <button onClick={finish} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Overslaan
          </button>
          <button
            onClick={next}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-colors neon-glow-sm"
          >
            {step < STEPS.length - 1 ? "Volgende →" : "Klaar!"}
          </button>
        </div>
      </div>
    </>
  );
}
