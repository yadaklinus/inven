"use client"

import { useEffect, useState, useCallback, useRef } from "react";
import { useOnlineStatus } from "./check-online";

interface SyncMetrics {
  totalTime?: number;
  totalRecords?: number;
  recordsPerSecond?: number;
  entityMetrics?: Record<string, { count: number; time: number; speed: number }>;
  errors?: string[];
  performance?: string;
  efficiency?: string;
}

interface EnhancedSyncStatus {
  status: boolean;
  loading: boolean;
  error?: string;
  isConnectionError?: boolean;
  lastSyncTime?: Date;
  retryCount?: number;
  metrics?: SyncMetrics;
  syncProgress?: string;
  syncMode?: 'regular' | 'ultra-fast';
  estimatedTime?: number;
}

interface EnhancedSyncOptions {
  regularUrl?: string;
  ultraFastUrl?: string;
  interval?: number;
  maxRetries?: number;
  enableBackgroundSync?: boolean;
  adaptiveInterval?: boolean;
  autoSelectMode?: boolean;
  performanceThreshold?: number; // records count threshold for ultra-fast mode
}

export function useEnhancedSync(options: EnhancedSyncOptions = {}) {
  const {
    regularUrl = "/api/syncNew",
    ultraFastUrl = "/api/sync/ultra-fast",
    interval = 60000,
    maxRetries = 5,
    enableBackgroundSync = true,
    adaptiveInterval = true,
    autoSelectMode = true,
    performanceThreshold = 500
  } = options;

  const [syncState, setSyncState] = useState<EnhancedSyncStatus>({
    status: false,
    loading: true,
    retryCount: 0,
    syncMode: 'regular'
  });
  
  const { online } = useOnlineStatus();
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncAttempt = useRef<number>(0);
  
  // Intelligent sync mode selection
  const selectOptimalSyncMode = useCallback(async (): Promise<'regular' | 'ultra-fast'> => {
    if (!autoSelectMode) return syncState.syncMode || 'regular';
    
    try {
      // Quick check of unsynced data count
      const statusResponse = await fetch('/api/sync/ultra-fast', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const totalUnsynced = statusData.totalUnsynced || 0;
        
        // Use ultra-fast mode for large datasets
        return totalUnsynced >= performanceThreshold ? 'ultra-fast' : 'regular';
      }
    } catch (error) {
      console.warn("Failed to check sync status for mode selection:", error);
    }
    
    return 'regular'; // Default fallback
  }, [autoSelectMode, performanceThreshold, syncState.syncMode]);

  // Calculate adaptive interval based on success rate and data volume
  const getAdaptiveInterval = useCallback(() => {
    if (!adaptiveInterval) return interval;
    
    const retryCount = syncState.retryCount || 0;
    const baseInterval = syncState.syncMode === 'ultra-fast' ? interval * 0.8 : interval; // Faster for ultra-fast mode
    
    if (retryCount === 0) {
      return baseInterval;
    } else if (retryCount < 3) {
      return baseInterval * 2;
    } else {
      return Math.min(baseInterval * 4, 300000); // Max 5 minutes
    }
  }, [interval, syncState.retryCount, syncState.syncMode, adaptiveInterval]);

  // Enhanced sync function with intelligent mode selection
  const performEnhancedSync = useCallback(async (isManual = false, forcedMode?: 'regular' | 'ultra-fast'): Promise<boolean> => {
    // Prevent concurrent sync operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Throttle sync attempts
    const now = Date.now();
    if (!isManual && now - lastSyncAttempt.current < 5000) {
      console.log("Sync throttled - too frequent attempts");
      return false;
    }
    lastSyncAttempt.current = now;

    // Select optimal sync mode
    const syncMode = forcedMode || await selectOptimalSyncMode();
    const syncUrl = syncMode === 'ultra-fast' ? ultraFastUrl : regularUrl;

    setSyncState(prev => ({ 
      ...prev, 
      loading: true, 
      error: undefined,
      syncProgress: "Analyzing data...",
      syncMode
    }));
    
    try {
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 60000); // 1 minute timeout

      setSyncState(prev => ({ ...prev, syncProgress: `Syncing (${syncMode} mode)...` }));

      const syncStart = Date.now();
      const res = await fetch(syncUrl, { 
        method: "POST",
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        let metrics: SyncMetrics = {};
        
        try {
          const responseData = await res.json();
          metrics = responseData.metrics || {};
        } catch {
          // Continue without metrics if parsing fails
        }

        const syncTime = Date.now() - syncStart;
        setSyncState(prev => ({
          ...prev,
          status: true,
          loading: false,
          error: undefined,
          lastSyncTime: new Date(),
          retryCount: 0,
          metrics,
          syncProgress: undefined,
          syncMode,
          estimatedTime: syncTime
        }));
        
        console.log(`✅ Enhanced sync completed successfully in ${syncTime}ms using ${syncMode} mode`, metrics);
        return true;
      } else {
        // Enhanced error handling
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        let isConnectionError = false;
        let metrics: SyncMetrics = {};

        try {
          const errorData = await res.json();
          if (errorData.error) {
            errorMessage = errorData.error;
            isConnectionError = errorData.isConnectionError || false;
            metrics = errorData.metrics || {};
          }
        } catch {
          // Use default error message if parsing fails
        }

        setSyncState(prev => ({
          ...prev,
          status: false,
          loading: false,
          error: errorMessage,
          isConnectionError,
          retryCount: Math.min((prev.retryCount || 0) + 1, maxRetries),
          metrics,
          syncProgress: undefined,
          syncMode
        }));
        
        console.error(`❌ Enhanced sync failed (${syncMode} mode):`, errorMessage);
        return false;
      }
    } catch (error) {
      let errorMessage = "Sync failed";
      let isConnectionError = true;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Sync timeout - operation took too long";
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = "Network error - check your connection";
          isConnectionError = true;
        } else {
          errorMessage = error.message;
          isConnectionError = false;
        }
      }

      setSyncState(prev => ({
        ...prev,
        status: false,
        loading: false,
        error: errorMessage,
        isConnectionError,
        retryCount: Math.min((prev.retryCount || 0) + 1, maxRetries),
        syncProgress: undefined,
        syncMode
      }));
      
      console.error(`❌ Enhanced sync error (${syncMode} mode):`, error);
      return false;
    } finally {
      abortControllerRef.current = null;
    }
  }, [regularUrl, ultraFastUrl, maxRetries, selectOptimalSyncMode]);

  // Manual sync triggers
  const triggerRegularSync = useCallback(() => {
    if (!online) {
      console.warn("Cannot sync - device is offline");
      return Promise.resolve(false);
    }
    return performEnhancedSync(true, 'regular');
  }, [online, performEnhancedSync]);

  const triggerUltraFastSync = useCallback(() => {
    if (!online) {
      console.warn("Cannot sync - device is offline");
      return Promise.resolve(false);
    }
    return performEnhancedSync(true, 'ultra-fast');
  }, [online, performEnhancedSync]);

  const triggerSmartSync = useCallback(() => {
    if (!online) {
      console.warn("Cannot sync - device is offline");
      return Promise.resolve(false);
    }
    return performEnhancedSync(true); // Auto-select mode
  }, [online, performEnhancedSync]);

  useEffect(() => {
    // Reset state when going offline
    if (!online) {
      setSyncState(prev => ({
        ...prev,
        status: false,
        loading: false,
        error: "No internet connection",
        isConnectionError: true,
        syncProgress: undefined
      }));
      
      // Clear any pending timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      
      return;
    }

    // Only proceed if background sync is enabled
    if (!enableBackgroundSync) {
      return;
    }

    // Enhanced retry logic
    const scheduleRetry = () => {
      const retryCount = syncState.retryCount || 0;
      if (retryCount >= maxRetries) {
        console.warn(`Max retries (${maxRetries}) reached. Stopping automatic sync.`);
        return;
      }
      
      const baseDelay = getAdaptiveInterval();
      const retryDelay = Math.min(baseDelay * Math.pow(1.5, retryCount), 300000); // Max 5 minutes
      
      console.log(`⏰ Scheduling enhanced sync retry in ${retryDelay / 1000}s (attempt ${retryCount + 1}/${maxRetries})`);
      
      retryTimerRef.current = setTimeout(() => {
        performEnhancedSync();
      }, retryDelay);
    };

    // Initial sync when coming online
    performEnhancedSync();

    // Set up regular interval with adaptive timing
    const currentInterval = getAdaptiveInterval();
    timerRef.current = setInterval(() => {
      if (syncState.status || (syncState.retryCount || 0) < maxRetries) {
        performEnhancedSync();
      } else {
        scheduleRetry();
      }
    }, currentInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [online, enableBackgroundSync, performEnhancedSync, getAdaptiveInterval, maxRetries, syncState.retryCount, syncState.status]);

  return {
    // Status
    status: syncState.status,
    loading: syncState.loading,
    error: syncState.error,
    isConnectionError: syncState.isConnectionError,
    lastSyncTime: syncState.lastSyncTime,
    retryCount: syncState.retryCount,
    
    // Metrics and performance
    metrics: syncState.metrics,
    syncProgress: syncState.syncProgress,
    syncMode: syncState.syncMode,
    estimatedTime: syncState.estimatedTime,
    
    // Manual triggers
    triggerRegularSync,
    triggerUltraFastSync,
    triggerSmartSync, // Auto-selects best mode
    
    // Status
    isOnline: online,
    canRetry: (syncState.retryCount || 0) < maxRetries,
    
    // Performance insights
    getPerformanceInsight: () => {
      if (!syncState.metrics?.recordsPerSecond) return "No data";
      const rps = syncState.metrics.recordsPerSecond;
      if (rps > 100) return "Excellent performance";
      if (rps > 50) return "Good performance";
      if (rps > 20) return "Average performance";
      return "Consider optimization";
    }
  };
}

// Lightweight hook for just getting sync status
export function useQuickSyncStatus() {
  const [status, setStatus] = useState<{
    totalUnsynced: number;
    hasUnsyncedData: boolean;
    unsyncedByEntity: Record<string, number>;
    loading: boolean;
    error?: string;
    recommendation?: string;
  }>({
    totalUnsynced: 0,
    hasUnsyncedData: false,
    unsyncedByEntity: {},
    loading: true
  });

  const refreshStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch('/api/sync/ultra-fast', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus({
          totalUnsynced: data.totalUnsynced || 0,
          hasUnsyncedData: data.hasUnsyncedData || false,
          unsyncedByEntity: data.unsyncedByEntity || {},
          recommendation: data.recommendation,
          loading: false
        });
      } else {
        throw new Error(`Failed to fetch sync status: ${response.statusText}`);
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  return {
    ...status,
    refreshStatus
  };
}