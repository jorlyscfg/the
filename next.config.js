/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dutndlhxnsseihxgfqpx.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3003', 'localhost:3004', '*.trycloudflare.com', '*.dokploy.com'],
    },
  },
}

module.exports = nextConfig
