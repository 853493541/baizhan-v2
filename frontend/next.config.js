/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,   // ✅ skip lint errors during build
  },
  typescript: {
    ignoreBuildErrors: true,    // ✅ skip TS errors during build
  },
};

module.exports = nextConfig;
