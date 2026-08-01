import type { NextConfig } from "next";

// The backend doesn't send CORS headers, so browser fetches to it directly
// get blocked. Routing through a same-origin Next.js rewrite avoids that —
// server-to-server requests aren't subject to CORS.
const BACKEND_API_URL = process.env.BACKEND_API_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!BACKEND_API_URL) return [];
    return [
      {
        source: "/backend-api/:path*",
        destination: `${BACKEND_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
