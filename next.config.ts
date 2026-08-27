import type { NextConfig } from "next";

const noReferrerHeaders = [
  {
    key: "Referrer-Policy",
    value: "no-referrer",
  },
];

const sensitiveAuthRoutes = ["/auth/:path*", "/invite/accept", "/reset-password"];

const nextConfig: NextConfig = {
  headers() {
    return sensitiveAuthRoutes.map((source) => ({
      headers: noReferrerHeaders,
      source,
    }));
  },
};

export default nextConfig;
