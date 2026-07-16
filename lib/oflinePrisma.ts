// lib/oflinePrisma.ts
import { PrismaClient } from "@/prisma/generated/offline";

declare global {
  // This allows reuse of the PrismaClient instance in development
  var offlinePrisma: PrismaClient | undefined;
}

const offlinePrisma = globalThis.offlinePrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
});

if (process.env.NODE_ENV !== "production") {
  globalThis.offlinePrisma = offlinePrisma;
}

export default offlinePrisma;