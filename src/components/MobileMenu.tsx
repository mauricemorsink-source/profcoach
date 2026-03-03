"use client";

import Link from "next/link";
import { useState } from "react";
import type { SessionPayload } from "@/lib/auth";

export default function MobileMenu({ session }: { session: SessionPayload | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label={open ? "Menu sluiten" : "Menu openen"}
        aria-expanded={open}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-2xl z-50">
          <div className="px-4 py-3 space-y-0.5">

            {/* Primary links */}
            {session && (session.isParticipant ?? true) && (
              <Link
                href="/play"
                onClick={() => setOpen(false)}
                className="flex items-center px-3 py-3 rounded-lg text-sm font-semibold text-white hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
              >
                Mijn team
              </Link>
            )}
            <Link
              href="/tussenstand"
              onClick={() => setOpen(false)}
              className="flex items-center px-3 py-3 rounded-lg text-sm font-semibold text-white hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
            >
              Tussenstand
            </Link>
            <Link
              href="/rules"
              onClick={() => setOpen(false)}
              className="flex items-center px-3 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Spelregels
            </Link>

            {/* Admin / Manager links */}
            {session && (session.role === "ADMIN" || session.role === "MANAGER") && (
              <div className="pt-2 mt-1 border-t border-slate-800 space-y-0.5">
                {session.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center px-3 py-3 rounded-lg text-sm font-semibold text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/manager"
                  onClick={() => setOpen(false)}
                  className="flex items-center px-3 py-3 rounded-lg text-sm font-semibold text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  Manager
                </Link>
              </div>
            )}

            {/* Auth */}
            <div className="pt-2 mt-1 border-t border-slate-800">
              {session ? (
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="w-full text-left px-3 py-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Uitloggen
                  </button>
                </form>
              ) : (
                <div className="space-y-0.5">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center px-3 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Inloggen
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center mx-3 py-3 rounded-lg text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                    style={{ boxShadow: "0 0 8px rgba(34,211,238,0.3)" }}
                  >
                    Registreren
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
