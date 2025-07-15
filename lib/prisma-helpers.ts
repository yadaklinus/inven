import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Types for syncable models
type SyncableModel = 
  | 'superAdmin' 
  | 'users' 
  | 'Settings' 
  | 'Warehouses' 
  | 'Sale' 
  | 'Customer' 
  | 'SaleItem' 
  | 'Product' 
  | 'PaymentMethod'

// Helper function to add sync fields to data
function addSyncFields<T extends Record<string, any>>(data: T): T & { sync: boolean; syncedAt: null } {
  return {
    ...data,
    sync: false,
    syncedAt: null
  }
}

// Wrapper for Prisma create operations
export async function createWithSync<T extends Record<string, any>>(
  model: SyncableModel,
  data: T
) {
  const dataWithSync = addSyncFields(data)
  // @ts-ignore - Dynamic model access
  return await prisma[model].create({
    data: dataWithSync
  })
}

// Wrapper for Prisma createMany operations
export async function createManyWithSync<T extends Record<string, any>>(
  model: SyncableModel,
  data: T[]
) {
  const dataWithSync = data.map(addSyncFields)
  // @ts-ignore - Dynamic model access
  return await prisma[model].createMany({
    data: dataWithSync
  })
}

// Wrapper for Prisma update operations
export async function updateWithSync<T extends Record<string, any>>(
  model: SyncableModel,
  where: any,
  data: T
) {
  const dataWithSync = addSyncFields(data)
  // @ts-ignore - Dynamic model access
  return await prisma[model].update({
    where,
    data: dataWithSync
  })
}

// Wrapper for Prisma updateMany operations
export async function updateManyWithSync<T extends Record<string, any>>(
  model: SyncableModel,
  where: any,
  data: T
) {
  const dataWithSync = addSyncFields(data)
  // @ts-ignore - Dynamic model access
  return await prisma[model].updateMany({
    where,
    data: dataWithSync
  })
}

// Wrapper for Prisma upsert operations
export async function upsertWithSync<T extends Record<string, any>>(
  model: SyncableModel,
  where: any,
  update: T,
  create: T
) {
  const updateWithSync = addSyncFields(update)
  const createWithSync = addSyncFields(create)
  
  // @ts-ignore - Dynamic model access
  return await prisma[model].upsert({
    where,
    update: updateWithSync,
    create: createWithSync
  })
}

// Helper to get all unsynced records for a model
export async function getUnsyncedRecords(model: SyncableModel) {
  // @ts-ignore - Dynamic model access
  return await prisma[model].findMany({
    where: { sync: false }
  })
}

// Helper to mark records as synced
export async function markAsSynced(model: SyncableModel, recordIds: string[]) {
  // @ts-ignore - Dynamic model access
  return await prisma[model].updateMany({
    where: { 
      id: { in: recordIds }
    },
    data: { 
      sync: true,
      syncedAt: new Date()
    }
  })
}

// Helper to mark all records as unsynced (for testing/reset)
export async function markAllAsUnsynced(model: SyncableModel) {
  // @ts-ignore - Dynamic model access
  return await prisma[model].updateMany({
    data: { 
      sync: false,
      syncedAt: null
    }
  })
}

// Get sync status for a model
export async function getSyncStatus(model: SyncableModel) {
  // @ts-ignore - Dynamic model access
  const total = await prisma[model].count()
  // @ts-ignore - Dynamic model access
  const unsynced = await prisma[model].count({
    where: { sync: false }
  })
  
  return {
    total,
    unsynced,
    synced: total - unsynced,
    progress: total > 0 ? ((total - unsynced) / total) * 100 : 100
  }
}

// Export the prisma instance for direct use when needed
export { prisma }