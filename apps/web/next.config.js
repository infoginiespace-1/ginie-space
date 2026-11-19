const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ["antd", "@ant-design/icons"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["antd", "@ant-design/icons"],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.ginie.space",
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const emptyPolyfill = path.resolve(__dirname, "src/lib/empty-polyfill.js");
      try {
        const polyfillModulePath = require.resolve("next/dist/build/polyfills/polyfill-module");
        config.resolve.alias[polyfillModulePath] = emptyPolyfill;
      } catch {}
      config.resolve.alias["../build/polyfills/polyfill-module"] = emptyPolyfill;
      config.resolve.alias["./build/polyfills/polyfill-module"] = emptyPolyfill;
    }
    return config;
  },
};

module.exports = nextConfig;
