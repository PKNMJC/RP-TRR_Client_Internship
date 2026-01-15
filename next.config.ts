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
          destination: `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000"}/api/:path*`, // Forward to backend (default port 3000)
        },
      ],
    };
  },
};

export default nextConfig;
