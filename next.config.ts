import type { NextConfig } from 'next';

const API_URL =
  process.env.NEXT_PUBLIC_BASALT_API_URL || 'http://localhost:5100';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/node/:path*',
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
