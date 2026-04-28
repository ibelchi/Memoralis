import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not defined in .env file')
  }

  // Use require for native modules to avoid bundling issues in Next.js dev mode
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')

  // better-sqlite3 expects a file path, so we remove the 'file:' prefix if present
  const dbPath = url.startsWith('file:') ? url.slice(5) : url
  const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath)
  
  // In Prisma 7, PrismaBetterSqlite3 acts as a factory and expects a config object { url: string }
  const adapter = new PrismaBetterSqlite3({ url: absolutePath })
  
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
