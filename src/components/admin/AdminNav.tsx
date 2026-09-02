"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Volgorde weerspiegelt hoe vaak iets wordt gebruikt: wedstrijden/deelnemers dagelijks,
// instellingen/content zelden — dus die laatste staan nu onderaan i.p.v. bovenaan.
const TAB_SECTIONS = [
  {
    heading: "Overzicht",
    tabs: [
      { href: "/admin", label: "Dashboard" },
    ],
  },
  {
    heading: "Wedstrijden & spelers",
    tabs: [
      { href: "/admin/wedstrijden", label: "Wedstrijden" },
      { href: "/admin/spelers", label: "Spelersbeheer" },
      { href: "/admin/totw", label: "Team of the Week" },
    ],
  },
  {
    heading: "Deelnemers & tussenstand",
    tabs: [
      { href: "/admin/gebruikers", label: "Deelnemers" },
      { href: "/admin/tussenstand", label: "Tussenstand" },
      { href: "/admin/statistieken", label: "Statistieken" },
    ],
  },
  {
    heading: "Instellingen",
    tabs: [
      { href: "/admin/instellingen", label: "Spelinstellingen" },
      { href: "/admin/content", label: "Content" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

function findCurrentLabel(pathname: string): { section: string; label: string } {
  for (const section of TAB_SECTIONS) {
    for (const tab of section.tabs) {
      if (isActive(pathname, tab.href)) return { section: section.heading, label: tab.label };
    }
  }
  return { section: "Overzicht", label: "Dashboard" };
}

export default function AdminNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = findCurrentLabel(pathname);

  // Sluit het uitklapmenu automatisch zodra er naar een andere pagina genavigeerd wordt.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobiel/tablet: huidige pagina + uitklapbaar, gegroepeerd menu i.p.v. één lange
          scrollbare rij (die bij veel tabjes al snel onoverzichtelijk/verdrukt aanvoelde) */}
      <div className="lg:hidden shrink-0 bg-slate-900 border-b border-slate-800 relative z-30">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="min-w-0">
            <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest">{current.section}</span>
            <span className="block text-sm font-semibold text-white truncate">{current.label}</span>
          </span>
          <span className={`text-slate-500 shrink-0 transition-transform ${mobileOpen ? "rotate-180" : ""}`}>▾</span>
        </button>

        {mobileOpen && (
          <div className="absolute left-0 right-0 top-full bg-slate-900 border-b border-slate-800 shadow-2xl max-h-[70vh] overflow-y-auto">
            {TAB_SECTIONS.map((section) => (
              <div key={section.heading} className="px-2 py-2 border-t border-slate-800/60 first:border-t-0">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-1">
                  {section.heading}
                </p>
                {section.tabs.map((tab) => {
                  const active = isActive(pathname, tab.href);
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`block px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "text-slate-300 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Vangt een klik buiten het uitklapmenu op om het te sluiten */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop: sidebar */}
      <aside className="hidden lg:flex w-52 shrink-0 bg-slate-900 border-r border-slate-800 p-4 flex-col">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-2 mb-3">Admin</p>
        {TAB_SECTIONS.map((section, i) => (
          <div key={section.heading} className={i > 0 ? "mt-4" : ""}>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-1">
              {section.heading}
            </p>
            {section.tabs.map((tab) => {
              const active = isActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors block ${
                    active
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        ))}
      </aside>
    </>
  );
}
