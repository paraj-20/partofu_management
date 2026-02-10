/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow access from any IP in dev mode (for mobile/external testing)
  // Note: This feature is relevant for Next.js 13.5+
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "10.139.246.51:3000", "10.139.246.51"]
    }
  }
}

export default nextConfig
