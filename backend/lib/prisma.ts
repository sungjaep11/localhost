// lib/prisma.ts
import { PrismaClient } from '../generated/prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // 터미널에 SQL 쿼리가 찍혀서 디버깅하기 좋아요
  } as any)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma