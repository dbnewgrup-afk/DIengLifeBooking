const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
