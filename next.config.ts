import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["mapbox-gl"],
  turbopack: {},
  // Allow react-big-calendar CSS imports from node_modules
  webpack(config) {
    return config;
  },
};

export default nextConfig;
