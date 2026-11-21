const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.ginie.space https://giniespace-api.onrender.com wss://api.ginie.space wss://giniespace-api.onrender.com https://*.googleapis.com https://maps.googleapis.com https://ipapi.co",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/s/:storeId*",
        destination: "/shop/:storeId*",
      },
    ];
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      const emptyPolyfill = path.resolve(__dirname, "src/lib/empty-polyfill.js");
      try {
        const polyfillModulePath = require.resolve("next/dist/build/polyfills/polyfill-module");
        config.resolve.alias[polyfillModulePath] = emptyPolyfill;
      } catch {}
      config.resolve.alias["../build/polyfills/polyfill-module"] = emptyPolyfill;
      config.resolve.alias["./build/polyfills/polyfill-module"] = emptyPolyfill;

      if (webpack) {
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            /[\\\/]next[\\\/]dist[\\\/]build[\\\/]polyfills[\\\/]polyfill-module/,
            emptyPolyfill
          )
        );
      }
    }
    return config;
  },
};

module.exports = nextConfig;
