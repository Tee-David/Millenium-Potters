import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Do not fail production builds on TS errors
    ignoreBuildErrors: true,
  },
  // eslint: {
  //   // Do not fail production builds on ESLint errors
  //   ignoreDuringBuilds: true,
  // },
  images: {
    // Allow external images and query strings
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    // Allow query strings for local images (for cache busting if needed)
    localPatterns: [
      {
        pathname: "/logo.png**",
      },
      {
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
