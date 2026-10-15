import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Cliente unico (ADR-0004): driver serverless de Neon via adapter, cacheado en globalThis
// para no crear instancias nuevas en hot-reload ni invocaciones calidas.
const globalForPrisma = globalThis;

function createClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;
