/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
      {
        source: '/storage/:path*',
        destination: 'https://appraiser-pasty-helpline.ngrok-free.dev/storage/:path*',
      },
      {
        source: '/api-storage/:path*',   // ← tambahkan ini juga
        destination: 'https://appraiser-pasty-helpline.ngrok-free.dev/storage/:path*',
      },
      {
      source: '/uploads/:path*',        // ← Tambahkan ini
      destination: 'https://appraiser-pasty-helpline.ngrok-free.dev/uploads/:path*',
    },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'appraiser-pasty-helpline.ngrok-free.dev',
      },
    ],
  },
};

module.exports = nextConfig;