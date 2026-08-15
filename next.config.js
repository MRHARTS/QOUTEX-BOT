/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'Meme Coin Hunter AI',
  },
};

module.exports = nextConfig;
