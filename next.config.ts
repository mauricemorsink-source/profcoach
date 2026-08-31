import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noimageindex, nocache" },
        ],
      },
    ];
  },
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

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Bronbestanden alleen uploaden als er een auth-token is ingesteld — anders
  // gewoon de build zonder source maps, geen harde vereiste.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
