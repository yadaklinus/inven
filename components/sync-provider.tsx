"use client"

import { createContext, useContext, ReactNode } from "react"
import { useAutoSync } from "@/hooks/use-auto-sync"
import { SyncSummary } from "@/lib/sync-service"

interface SyncContextType {
  online: boolean
  loading: boolean
  isSyncing: boolean
  lastSyncResult: SyncSummary | null
  syncError: string | null
  triggerSync: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

interface SyncProviderProps {
  children: ReactNode
  enableAutoSync?: boolean
  syncInterval?: number
  showNotifications?: boolean
}

export function SyncProvider({ 
  children, 
  enableAutoSync = true,
  syncInterval = 30000,
  showNotifications = true
}: SyncProviderProps) {
  const syncData = useAutoSync({
    enableAutoSync,
    syncInterval,
    showNotifications
  })

  return (
    <SyncContext.Provider value={syncData}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}