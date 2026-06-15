"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const TAB_SECTIONS = [
  {
    heading: "Instellingen",
    tabs: [
      { href: "/admin/instellingen", label: "Spelinstellingen" },
      { href: "/admin/puntensysteem", label: "Puntensysteem" },
    ],
  },
  {
    heading: "Seizoen",
    tabs: [
      { href: "/admin/wedstrijden", label: "Wedstrijden" },
      { href: "/admin/spelers", label: "Spelersbeheer" },
    ],
  },
  {
    heading: "Bonus",
    tabs: [
      { href: "/admin/bonusvragen", label: "Bonusvragen" },
    ],
  },
  {
    heading: "Accounts",
    tabs: [
      { href: "/admin/gebruikers", label: "Gebruikers" },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeLabel =
    TAB_SECTIONS.flatMap((s) => s.tabs).find((t) => pathname.startsWith(t.href))?.label ?? "Admin";

  return (
    <>
      {/* Mobile/tablet top bar + hamburger dropdown */}
      <div className="lg:hidden relative shrink-0 z-30">
        <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3">
          <span className="text-sm font-semibold text-white">{activeLabel}</span>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="p-1 text-slate-400 hover:text-white transition-colors text-xl leading-none w-8 h-8 flex items-center justify-center"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-2xl">
            {TAB_SECTIONS.map((section) => (
              <div key={section.heading} className="px-4 py-2 border-b border-slate-800 last:border-b-0">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest pt-1 mb-1">
                  {section.heading}
                </p>
                {section.tabs.map((tab) => (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 block ${
                      pathname.startsWith(tab.href)
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-52 shrink-0 bg-slate-900 border-r border-slate-800 p-4 flex-col">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-2 mb-3">Admin</p>
        {TAB_SECTIONS.map((section, i) => (
          <div key={section.heading} className={i > 0 ? "mt-4" : ""}>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-1">
              {section.heading}
            </p>
            {section.tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors block ${
                  pathname.startsWith(tab.href)
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        ))}
      </aside>
    </>
  );
}
