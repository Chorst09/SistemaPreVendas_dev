import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '10.10.50.182',
    '10.10.*.*',
    '10.*.*.*',
    '192.168.18.34',
    '192.168.*.*'
  ],

  typescript: {
    ignoreBuildErrors: true,
  },
  
  serverExternalPackages: ['@prisma/client'],
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },

  turbopack: {},
};

export default nextConfig;
