import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't transpile - use built dist/ instead
  // transpilePackages: ['llm-router'],
  
  // Turbopack configuration for Next.js 16
  turbopack: {
    resolveAlias: {
      // Fix for tiktoken WASM file
      'tiktoken_bg.wasm': require.resolve('@dqbd/tiktoken/tiktoken_bg.wasm'),
    },
  },
  
  // Webpack config for production builds (still uses webpack)
  webpack: (config, { isServer }) => {
    // Fix for tiktoken WASM file
    config.resolve.alias = {
      ...config.resolve.alias,
      'tiktoken_bg.wasm': require.resolve('@dqbd/tiktoken/tiktoken_bg.wasm'),
    };

    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

export default nextConfig;
