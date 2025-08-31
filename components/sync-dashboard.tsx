"use client"

import React, { useState, useEffect } from 'react';
import { useEnhancedSync, useQuickSyncStatus } from '@/hooks/use-enhanced-sync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Zap, 
  Clock, 
  Database,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

export function SyncDashboard() {
  const {
    status,
    loading,
    error,
    isConnectionError,
    lastSyncTime,
    retryCount,
    metrics,
    syncProgress,
    syncMode,
    estimatedTime,
    triggerRegularSync,
    triggerUltraFastSync,
    triggerSmartSync,
    isOnline,
    canRetry,
    getPerformanceInsight
  } = useEnhancedSync({
    enableBackgroundSync: true,
    autoSelectMode: true,
    adaptiveInterval: true
  });

  const {
    totalUnsynced,
    hasUnsyncedData,
    unsyncedByEntity,
    recommendation,
    refreshStatus
  } = useQuickSyncStatus();

  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Handle manual sync
  const handleManualSync = async (mode: 'smart' | 'regular' | 'ultra-fast') => {
    setIsManualSyncing(true);
    try {
      let success = false;
      switch (mode) {
        case 'smart':
          success = await triggerSmartSync();
          break;
        case 'regular':
          success = await triggerRegularSync();
          break;
        case 'ultra-fast':
          success = await triggerUltraFastSync();
          break;
      }
      
      if (success) {
        await refreshStatus();
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Get status color and icon
  const getStatusIndicator = () => {
    if (loading || isManualSyncing) {
      return { color: 'bg-blue-500', icon: RefreshCw, text: 'Syncing...', className: 'animate-spin' };
    }
    if (!isOnline) {
      return { color: 'bg-gray-500', icon: WifiOff, text: 'Offline', className: '' };
    }
    if (status) {
      return { color: 'bg-green-500', icon: CheckCircle, text: 'Synced', className: '' };
    }
    if (isConnectionError) {
      return { color: 'bg-red-500', icon: XCircle, text: 'Connection Error', className: '' };
    }
    return { color: 'bg-yellow-500', icon: AlertCircle, text: 'Error', className: '' };
  };

  const statusIndicator = getStatusIndicator();
  const StatusIcon = statusIndicator.icon;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sync Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${statusIndicator.color}`} />
          <StatusIcon className={`w-4 h-4 ${statusIndicator.className}`} />
          <span className="text-sm font-medium">{statusIndicator.text}</span>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isOnline ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-red-500" />}
            <span>Connection Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold">{isOnline ? 'Online' : 'Offline'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Sync</p>
              <p className="font-semibold">
                {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Retry Count</p>
              <p className="font-semibold">{retryCount || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mode</p>
              <Badge variant={syncMode === 'ultra-fast' ? 'default' : 'secondary'}>
                {syncMode || 'regular'}
              </Badge>
            </div>
          </div>
          
          {syncProgress && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">{syncProgress}</p>
              <Progress value={loading ? undefined : 100} className="w-full" />
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Controls</CardTitle>
          <CardDescription>Manually trigger sync operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => handleManualSync('smart')}
              disabled={!isOnline || isManualSyncing}
              className="flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Smart Sync</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleManualSync('ultra-fast')}
              disabled={!isOnline || isManualSyncing}
              className="flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Ultra-Fast</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleManualSync('regular')}
              disabled={!isOnline || isManualSyncing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Regular</span>
            </Button>

            <Button 
              variant="ghost"
              onClick={refreshStatus}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Refresh Status</span>
            </Button>
          </div>

          {recommendation && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600">💡 {recommendation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unsynced Data Overview */}
      {hasUnsyncedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Unsynced Data</span>
              <Badge variant="destructive">{totalUnsynced}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(unsyncedByEntity).map(([entity, count]) => (
                count > 0 && (
                  <div key={entity} className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">{entity}</p>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Performance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Time</p>
                <p className="text-2xl font-bold">{metrics.totalTime}ms</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Records Synced</p>
                <p className="text-2xl font-bold">{metrics.totalRecords}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Speed</p>
                <p className="text-2xl font-bold">{metrics.recordsPerSecond} rps</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Performance</p>
                <Badge variant={
                  metrics.performance === 'Excellent' ? 'default' :
                  metrics.performance === 'Good' ? 'secondary' : 'destructive'
                }>
                  {metrics.performance || getPerformanceInsight()}
                </Badge>
              </div>
            </div>

            {metrics.entityMetrics && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Entity Performance</h4>
                <div className="space-y-2">
                  {Object.entries(metrics.entityMetrics).map(([entity, entityMetrics]) => (
                    <div key={entity} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{entity}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{entityMetrics.count} records</span>
                        <span className="text-sm font-semibold">{entityMetrics.speed} rps</span>
                        <Badge variant="outline" className="text-xs">
                          {entityMetrics.time}ms
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {!hasUnsyncedData && status && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">All data is synchronized</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Compact sync status component for headers/navigation
export function SyncStatusIndicator() {
  const { status, loading, isOnline, metrics } = useEnhancedSync();
  const { totalUnsynced } = useQuickSyncStatus();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
        <span className="text-sm">Syncing...</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center space-x-2">
        <WifiOff className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">Offline</span>
      </div>
    );
  }

  if (status && totalUnsynced === 0) {
    return (
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-600">Synced</span>
        {metrics?.recordsPerSecond && (
          <Badge variant="outline" className="text-xs">
            {metrics.recordsPerSecond} rps
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <AlertCircle className="w-4 h-4 text-orange-500" />
      <span className="text-sm text-orange-600">
        {totalUnsynced > 0 ? `${totalUnsynced} pending` : 'Error'}
      </span>
    </div>
  );
}