import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Ensure Prisma client is bundled correctly for server components on Railway
  serverExternalPackages: ['@prisma/client'],
  
  // Webpack configuration for Prisma
  webpack: (config) => {
    config.externals = config.externals || []
    config.externals.push('@prisma/client')
    return config
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['tailwindcss']
  },

  // Ensure proper port handling for Railway
  env: {
    PORT: process.env.PORT || '3000'
  }
}

export default nextConfig
