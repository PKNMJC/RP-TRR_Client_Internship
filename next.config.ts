import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  skipTrailingSlashRedirect: true,

  // ✅ API proxy configuration
  // Forward /api/* requests to backend
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/:path*`, // Forward to backend with /api prefix
        },
      ],
    };
  },
};

export default nextConfig;
