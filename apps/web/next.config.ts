import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@medium-publisher/types'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default config;
