import { PrismaClient } from '@prisma/client';
export const prisma = globalThis.prismaGlobal ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma;
}
