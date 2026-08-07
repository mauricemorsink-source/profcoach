import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/play", destination: "/mijn-team", permanent: true },
      { source: "/team/:teamEntryId", destination: "/mijn-team/:teamEntryId", permanent: true },
      { source: "/rules", destination: "/spelregels", permanent: true },
      { source: "/terms", destination: "/voorwaarden", permanent: true },
      { source: "/tussenstand", destination: "/tussenstand/deelnemers", permanent: false },
    ];
  },
};

export default nextConfig;
