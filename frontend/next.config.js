// next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: true,

  // REQUIRED
  output: "standalone",

  // 🔴 STOP OCI KILLERS
  swcMinify: false,        // ← CRITICAL
  productionBrowserSourceMaps: false,

  // Kill static optimization burst
  experimental: {
    appDir: true,
    optimizeCss: false,
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.parallelism = 1;
    }
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
