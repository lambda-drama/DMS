/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production'

const nextConfig = {
  ...(isDev ? {} : { output: 'export' }),

  basePath: '/dms',

  assetPrefix: isDev ? '' : '/assets/dms/frontend',

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  ...(isDev
    ? {
        async rewrites() {
          const frappeUrl = process.env.FRAPPE_URL || 'http://localhost:8000'
          return [
            {
              source: '/api/:path*',
              destination: `${frappeUrl}/api/:path*`,
            },
            {
              source: '/files/:path*',
              destination: `${frappeUrl}/files/:path*`,
            },
            {
              source: '/assets/dms/:path*',
              destination: `${frappeUrl}/assets/dms/:path*`,
            },
          ]
        },
      }
    : {}),
}

export default nextConfig
