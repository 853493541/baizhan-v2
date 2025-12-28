const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip lint & type errors during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: true,

  /**
   * ❗ DO NOT set `outputFileTracing: false`
   * This option DOES NOT EXIST in Next 15.
   *
   * Tracing is only triggered when:
   *   output === "standalone"
   *
   * Since we are NOT using standalone,
   * tracing will NOT run.
   */

  // ✅ Default output (no tracing, no standalone)
  // output: undefined  ← implicit default, do NOT set

  /**
   * Reduce build parallelism to avoid memory spikes
   * on constrained VMs
   */
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.parallelism = 1;
    }
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
