import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-d2aa4de4f2b947efb4a28494fe09c1e9.r2.dev",
        pathname: "/modules/donation/projects/**",
      },
      {
        protocol: "https",
        hostname: "pub-d2aa4de4f2b947efb4a28494fe09c1e9.r2.dev",
        pathname: "/modules/donation/categories/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
