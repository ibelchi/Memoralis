/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', '@prisma/adapter-better-sqlite3', 'pdfjs-dist', 'canvas'],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    MEDIA_PATH: process.env.MEDIA_PATH,
  },
};

export default nextConfig;
