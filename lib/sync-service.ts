import { PrismaClient } from '@prisma/client'

// Types for sync operations
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

interface SyncResult {
  success: boolean
  syncedCount: number
  errors: string[]
  model: SyncableModel
}

interface SyncSummary {
  totalSynced: number
  totalErrors: number
  modelResults: SyncResult[]
  completedAt: Date
}

class SyncService {
  private prisma: PrismaClient
  private onlineApiUrl: string
  private isOnline: boolean = false

  constructor() {
    this.prisma = new PrismaClient()
    this.onlineApiUrl = process.env.ONLINE_API_URL || ''
  }

  // Set online status
  setOnlineStatus(status: boolean) {
    this.isOnline = status
  }

  // Get all unsynced records for a specific model
  private async getUnsyncedRecords(model: SyncableModel) {
    try {
      // @ts-ignore - Dynamic model access
      return await this.prisma[model].findMany({
        where: { sync: false }
      })
    } catch (error) {
      console.error(`Error fetching unsynced ${model}:`, error)
      return []
    }
  }

  // Push data to online database via API
  private async pushToOnlineDatabase(model: SyncableModel, data: any[]): Promise<{ success: boolean; errors: string[] }> {
    if (!this.onlineApiUrl) {
      return { success: false, errors: ['Online API URL not configured'] }
    }

    const errors: string[] = []
    let successCount = 0

    for (const record of data) {
      try {
        const response = await fetch(`${this.onlineApiUrl}/api/sync/${model}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SYNC_API_KEY || ''}`
          },
          body: JSON.stringify(record)
        })

        if (!response.ok) {
          const errorText = await response.text()
          errors.push(`Failed to sync ${model} record ${record.id}: ${errorText}`)
        } else {
          successCount++
        }
      } catch (error) {
        errors.push(`Network error syncing ${model} record ${record.id}: ${error}`)
      }
    }

    return { 
      success: errors.length === 0, 
      errors 
    }
  }

  // Mark records as synced
  private async markAsSynced(model: SyncableModel, recordIds: string[]) {
    try {
      // @ts-ignore - Dynamic model access
      await this.prisma[model].updateMany({
        where: { 
          id: { in: recordIds }
        },
        data: { 
          sync: true,
          syncedAt: new Date()
        }
      })
    } catch (error) {
      console.error(`Error marking ${model} records as synced:`, error)
    }
  }

  // Sync a specific model
  private async syncModel(model: SyncableModel): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      syncedCount: 0,
      errors: [],
      model
    }

    try {
      // Get unsynced records
      const unsyncedRecords = await this.getUnsyncedRecords(model)
      
      if (unsyncedRecords.length === 0) {
        result.success = true
        return result
      }

      // Push to online database
      const pushResult = await this.pushToOnlineDatabase(model, unsyncedRecords)
      
      if (pushResult.success) {
        // Mark as synced
        const recordIds = unsyncedRecords.map(record => record.id)
        await this.markAsSynced(model, recordIds)
        
        result.success = true
        result.syncedCount = unsyncedRecords.length
      } else {
        result.errors = pushResult.errors
      }
    } catch (error) {
      result.errors.push(`Error syncing ${model}: ${error}`)
    }

    return result
  }

  // Sync all models
  async syncAllData(): Promise<SyncSummary> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }

    const models: SyncableModel[] = [
      'superAdmin',
      'users', 
      'Settings',
      'Warehouses',
      'Customer',
      'Product',
      'Sale',
      'SaleItem',
      'PaymentMethod'
    ]

    const modelResults: SyncResult[] = []
    let totalSynced = 0
    let totalErrors = 0

    // Sync models in order (to handle dependencies)
    for (const model of models) {
      console.log(`Syncing ${model}...`)
      const result = await this.syncModel(model)
      modelResults.push(result)
      
      totalSynced += result.syncedCount
      totalErrors += result.errors.length

      if (result.errors.length > 0) {
        console.error(`Errors syncing ${model}:`, result.errors)
      }
    }

    const summary: SyncSummary = {
      totalSynced,
      totalErrors,
      modelResults,
      completedAt: new Date()
    }

    console.log('Sync completed:', summary)
    return summary
  }

  // Get sync status for all models
  async getSyncStatus() {
    const models: SyncableModel[] = [
      'superAdmin',
      'users',
      'Settings', 
      'Warehouses',
      'Customer',
      'Product',
      'Sale',
      'SaleItem',
      'PaymentMethod'
    ]

    const status: Record<string, { total: number; unsynced: number }> = {}

    for (const model of models) {
      try {
        // @ts-ignore - Dynamic model access
        const total = await this.prisma[model].count()
        // @ts-ignore - Dynamic model access  
        const unsynced = await this.prisma[model].count({
          where: { sync: false }
        })
        
        status[model] = { total, unsynced }
      } catch (error) {
        console.error(`Error getting sync status for ${model}:`, error)
        status[model] = { total: 0, unsynced: 0 }
      }
    }

    return status
  }

  // Manual sync trigger
  async triggerSync(): Promise<SyncSummary> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }

    return await this.syncAllData()
  }

  // Reset sync status (mark all as unsynced)
  async resetSyncStatus() {
    const models: SyncableModel[] = [
      'superAdmin',
      'users',
      'Settings',
      'Warehouses', 
      'Customer',
      'Product',
      'Sale',
      'SaleItem',
      'PaymentMethod'
    ]

    for (const model of models) {
      try {
        // @ts-ignore - Dynamic model access
        await this.prisma[model].updateMany({
          data: { 
            sync: false,
            syncedAt: null
          }
        })
      } catch (error) {
        console.error(`Error resetting sync status for ${model}:`, error)
      }
    }
  }
}

// Export singleton instance
export const syncService = new SyncService()
export type { SyncSummary, SyncResult }