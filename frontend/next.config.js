const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,   // ✅ skip lint errors during build
  },
  typescript: {
    ignoreBuildErrors: true,    // ✅ skip TS errors during build
  },
  reactStrictMode: true,
};

module.exports = withBundleAnalyzer(nextConfig);
