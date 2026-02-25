import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jhzkiwrzqpbzgtrfldup.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: *.supabase.co replicate.delivery jhzkiwrzqpbzgtrfldup.supabase.co; font-src 'self' fonts.gstatic.com; connect-src 'self' *.supabase.co jhzkiwrzqpbzgtrfldup.supabase.co fonts.gstatic.com replicate.delivery;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
