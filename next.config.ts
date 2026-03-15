import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      { source: '/', destination: '/dashboard', permanent: true },
    ];
  },
};

export default nextConfig;
