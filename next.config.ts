import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
};

export default nextConfig;
