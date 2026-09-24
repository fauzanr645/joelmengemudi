import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Gunakan singleton pattern agar warm container di Vercel Serverless
// dapat menggunakan kembali koneksi connection pool Neon DB tanpa inisialisasi ulang
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prisma = prisma;

export default prisma;
