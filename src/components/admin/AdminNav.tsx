"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TAB_SECTIONS = [
  {
    heading: "Overzicht",
    tabs: [
      { href: "/admin", label: "Dashboard" },
    ],
  },
  {
    heading: "Instellingen",
    tabs: [
      { href: "/admin/instellingen", label: "Spelinstellingen" },
      { href: "/admin/puntensysteem", label: "Puntensysteem" },
      { href: "/admin/teksten", label: "Teksten" },
    ],
  },
  {
    heading: "Seizoen",
    tabs: [
      { href: "/admin/wedstrijden", label: "Wedstrijden" },
      { href: "/admin/spelers", label: "Spelersbeheer" },
      { href: "/admin/totw", label: "Team of the Week" },
    ],
  },
  {
    heading: "Deelnemers",
    tabs: [
      { href: "/admin/gebruikers", label: "Deelnemers" },
      { href: "/admin/statistieken", label: "Statistieken" },
    ],
  },
];

const ALL_TABS = TAB_SECTIONS.flatMap((s) => s.tabs);

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobiel/tablet: horizontale scrollbare tabstrip */}
      <div className="lg:hidden shrink-0 bg-slate-900 border-b border-slate-800 overflow-x-auto relative">
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10" />
        <div className="flex min-w-max px-3 py-2 gap-1">
          {ALL_TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
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
      </div>

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
