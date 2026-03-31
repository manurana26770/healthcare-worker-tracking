import type { NextConfig } from "next";

const nestAuthCutoverEnabled = process.env.NEST_AUTH_CUTOVER_ENABLED === "true";
const nestBackendBaseUrl = (process.env.NEST_BACKEND_BASE_URL ?? "http://localhost:3333").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!nestAuthCutoverEnabled) {
      return [];
    }

    return [
      {
        source: "/api/auth/:path*",
        destination: `${nestBackendBaseUrl}/api/auth/:path*`,
      },
      {
        source: "/api/logout",
        destination: `${nestBackendBaseUrl}/api/logout`,
      },
    ];
  },
};

export default nextConfig;
