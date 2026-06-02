import { PrismaClient } from '@prisma/client'

// 개발 환경에서 여러 번 생성되는 것을 방지하는 로직입니다.
const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // 터미널에서 실제 날아가는 쿼리를 볼 수 있어 에러 잡기 좋습니다.
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma