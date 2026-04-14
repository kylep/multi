import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "Cache-Control", value: "no-store, must-revalidate" },
      ],
    },
  ],
};

export default nextConfig;
