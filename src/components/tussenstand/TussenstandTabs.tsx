"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TussenstandTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/tussenstand/deelnemers", label: "Deelnemers" },
    { href: "/tussenstand/statistieken", label: "Statistieken" },
  ];

  return (
    <div className="flex gap-2 mb-5">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            pathname === tab.href
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
