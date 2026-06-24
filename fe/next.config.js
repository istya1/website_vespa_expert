/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.expertvespa.cloud/api/:path*',
      },
      {
        source: '/storage/:path*',
        destination: 'https://api.expertvespa.cloud/storage/:path*',
      },
      {
        source: '/api-storage/:path*',
        destination: 'https://api.expertvespa.cloud/storage/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'https://api.expertvespa.cloud/uploads/:path*',
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.expertvespa.cloud',
      },
    ],
  },
};

module.exports = nextConfig;