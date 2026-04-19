import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      { source: "/villa", destination: "/catalog?type=villa" },
      { source: "/jeep", destination: "/catalog?type=jeep" },
      { source: "/rent", destination: "/catalog?type=transport" },
      { source: "/dokumentasi", destination: "/catalog?type=dokumentasi" },
    ];
  },
};

export default nextConfig;
