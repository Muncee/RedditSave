import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.redd.it" },
      { protocol: "https", hostname: "*.reddit.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "external-preview.redd.it" },
      { protocol: "https", hostname: "preview.redd.it" },
    ],
  },
};

export default nextConfig;
