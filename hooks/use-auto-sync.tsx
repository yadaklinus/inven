"use client"

import { useEffect, useState, useCallback } from "react"
import { useOnlineStatus } from "./check-online"
import { syncService, type SyncSummary } from "@/lib/sync-service"
import toast from "react-hot-toast"

interface AutoSyncOptions {
  enableAutoSync?: boolean
  syncInterval?: number // in milliseconds
  showNotifications?: boolean
}

export function useAutoSync(options: AutoSyncOptions = {}) {
  const {
    enableAutoSync = true,
    syncInterval = 30000, // 30 seconds
    showNotifications = true
  } = options

  const { online, loading } = useOnlineStatus()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncSummary | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Update sync service online status
  useEffect(() => {
    syncService.setOnlineStatus(online)
  }, [online])

  // Manual sync function
  const triggerSync = useCallback(async () => {
    if (!online) {
      const errorMsg = "Cannot sync while offline"
      setSyncError(errorMsg)
      if (showNotifications) {
        toast.error(errorMsg)
      }
      return
    }

    if (isSyncing) {
      if (showNotifications) {
        toast.error("Sync already in progress")
      }
      return
    }

    setIsSyncing(true)
    setSyncError(null)

    try {
      const result = await syncService.triggerSync()
      setLastSyncResult(result)

      if (showNotifications) {
        if (result.totalErrors > 0) {
          toast.error(`Sync completed with ${result.totalErrors} errors. ${result.totalSynced} records synced.`)
        } else if (result.totalSynced > 0) {
          toast.success(`Successfully synced ${result.totalSynced} records`)
        } else {
          toast.success("All data is already synced")
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Sync failed"
      setSyncError(errorMsg)
      if (showNotifications) {
        toast.error(errorMsg)
      }
    } finally {
      setIsSyncing(false)
    }
  }, [online, isSyncing, showNotifications])

  // Auto sync when coming online
  useEffect(() => {
    if (!enableAutoSync || loading || !online || isSyncing) {
      return
    }

    // Trigger sync when coming online
    const timeoutId = setTimeout(() => {
      triggerSync()
    }, 2000) // Wait 2 seconds after coming online

    return () => clearTimeout(timeoutId)
  }, [online, loading, enableAutoSync, triggerSync, isSyncing])

  // Periodic auto sync while online
  useEffect(() => {
    if (!enableAutoSync || !online || loading) {
      return
    }

    const intervalId = setInterval(() => {
      if (!isSyncing) {
        triggerSync()
      }
    }, syncInterval)

    return () => clearInterval(intervalId)
  }, [online, loading, enableAutoSync, syncInterval, triggerSync, isSyncing])

  return {
    online,
    loading,
    isSyncing,
    lastSyncResult,
    syncError,
    triggerSync
  }
}