import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@n3q/shared"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      path: false,
      os: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };

    // Ignore missing optional dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/@react-native-async-storage/ },
      { module: /node_modules\/@walletconnect/ },
    ];

    return config;
  },
};

export default nextConfig;
