/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
