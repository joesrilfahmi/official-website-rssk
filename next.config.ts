import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jnakktdrsfzmdnepsymp.supabase.co',
      },
    ],
  },
};

export default nextConfig;