"use client"

import { useState, useEffect } from "react"
import { useAutoSync } from "@/hooks/use-auto-sync"
import { syncService } from "@/lib/sync-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Database,
  Loader2
} from "lucide-react"

interface SyncStatusProps {
  showDetails?: boolean
  compact?: boolean
}

export function SyncStatus({ showDetails = false, compact = false }: SyncStatusProps) {
  const { online, loading, isSyncing, lastSyncResult, syncError, triggerSync } = useAutoSync()
  const [syncStatus, setSyncStatus] = useState<Record<string, { total: number; unsynced: number }>>({})
  const [loadingStatus, setLoadingStatus] = useState(false)

  // Load sync status
  useEffect(() => {
    const loadSyncStatus = async () => {
      setLoadingStatus(true)
      try {
        const status = await syncService.getSyncStatus()
        setSyncStatus(status)
      } catch (error) {
        console.error('Failed to load sync status:', error)
      } finally {
        setLoadingStatus(false)
      }
    }

    loadSyncStatus()
    
    // Refresh status every 30 seconds
    const interval = setInterval(loadSyncStatus, 30000)
    return () => clearInterval(interval)
  }, [lastSyncResult])

  // Calculate totals
  const totalRecords = Object.values(syncStatus).reduce((sum, { total }) => sum + total, 0)
  const unsyncedRecords = Object.values(syncStatus).reduce((sum, { unsynced }) => sum + unsynced, 0)
  const syncProgress = totalRecords > 0 ? ((totalRecords - unsyncedRecords) / totalRecords) * 100 : 100

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : online ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        
        <Badge variant={unsyncedRecords > 0 ? "destructive" : "default"}>
          {unsyncedRecords} unsynced
        </Badge>

        <Button
          size="sm"
          variant="outline"
          onClick={triggerSync}
          disabled={!online || isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sync Status
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : online ? (
            <Badge variant="default" className="bg-green-500">Online</Badge>
          ) : (
            <Badge variant="destructive">Offline</Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Sync Progress</span>
            <span>{Math.round(syncProgress)}%</span>
          </div>
          <Progress value={syncProgress} />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{totalRecords - unsyncedRecords} synced</span>
            <span>{unsyncedRecords} pending</span>
          </div>
        </div>

        {/* Sync Actions */}
        <div className="flex gap-2">
          <Button
            onClick={triggerSync}
            disabled={!online || isSyncing}
            className="flex-1"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>

        {/* Last Sync Result */}
        {lastSyncResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {lastSyncResult.totalErrors > 0 ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span>
                Last sync: {lastSyncResult.totalSynced} records, {lastSyncResult.totalErrors} errors
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {lastSyncResult.completedAt.toLocaleString()}
            </div>
          </div>
        )}

        {/* Sync Error */}
        {syncError && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span>{syncError}</span>
          </div>
        )}

        {/* Detailed Status */}
        {showDetails && !loadingStatus && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Model Status</h4>
            <div className="space-y-1">
              {Object.entries(syncStatus).map(([model, { total, unsynced }]) => (
                <div key={model} className="flex justify-between text-xs">
                  <span className="capitalize">{model}</span>
                  <span className={unsynced > 0 ? "text-red-500" : "text-green-500"}>
                    {total - unsynced}/{total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}