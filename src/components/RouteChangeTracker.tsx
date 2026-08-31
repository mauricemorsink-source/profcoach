"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // De allereerste paginaweergave wordt al automatisch gemeten door de
    // Google-tag zelf (bij het laden van gtm.js). Alleen latere, client-side
    // navigaties (Next.js Link-clicks) sturen we hier zelf door, want die
    // triggeren geen nieuwe page load en worden anders gemist.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    trackEvent("page_view", {
      page_path: path,
      page_location: window.location.origin + path,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function RouteChangeTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
