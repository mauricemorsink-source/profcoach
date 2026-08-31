"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="nl">
      <body className="antialiased">
        <div
          className="min-h-screen flex items-center justify-center p-4 sm:p-8"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(14,40,80,0.7) 0%, #060b14 70%)" }}
        >
          <div className="bg-slate-900 rounded-2xl border border-cyan-500/20 p-8 sm:p-10 w-full max-w-sm text-center shadow-2xl">
            <div
              className="flex items-center justify-center gap-1 text-6xl sm:text-7xl font-black text-white mb-3"
              style={{ textShadow: "0 0 24px rgba(239,68,68,0.35)" }}
            >
              <span>💥</span>
            </div>
            <h1 className="text-lg font-black text-white mb-1">Er is iets misgegaan</h1>
            <p className="text-slate-400 text-sm mb-6">
              Er ging onverwacht iets fout. We zijn hiervan op de hoogte gebracht.
            </p>
            <button
              onClick={reset}
              className="block w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm transition-colors"
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
