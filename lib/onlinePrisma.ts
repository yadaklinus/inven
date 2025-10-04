// lib/prisma.ts
import { PrismaClient } from "@/prisma/generated/online";

async function isOnline() {
  try {
    // Use a fast DNS or lightweight ping
    const response = await fetch("https://ping-v6lv.onrender.com/", { method: "GET" })
    return response.ok;
  } catch {
    return false;
  }
}

declare global {
  // This allows reuse of the PrismaClient instance in development
  var onlinePrisma: PrismaClient | undefined;
}

const onlinePrisma = globalThis.onlinePrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});

if (process.env.NODE_ENV !== "production") globalThis.onlinePrisma = onlinePrisma;

// Ensure connection on startup
async function ensureConnection() {
  if (!(await isOnline())) {
    console.warn("⚠️ Skipping Prisma connection — offline mode detected");
    return;
  }
  
  try {
    await onlinePrisma.$connect();
    console.log("Online Prisma client connected successfully");
  } catch (error) {
    console.error("Failed to connect online Prisma client:", error);
  }
}

// Auto-connect when module is imported
ensureConnection();

// Graceful shutdown
process.on('beforeExit', async () => {
  await onlinePrisma.$disconnect();
});

export default onlinePrisma;