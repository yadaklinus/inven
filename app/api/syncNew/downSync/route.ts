import { NextRequest, NextResponse } from "next/server";
import pMap from "p-map";

import onlinePrisma from "@/lib/onlinePrisma";
import offlinePrisma from "@/lib/oflinePrisma";

interface SyncProgress {
  entity: string;
  completed: number;
  total: number;
  status: 'pending' | 'syncing' | 'completed' | 'error' | 'skipped';
  error?: string;
}

interface SyncResult {
  success: boolean;
  totalEntities: number;
  completedEntities: number;
  skippedEntities: number;
  progress: SyncProgress[];
  errors: string[];
  warnings: string[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  mode: 'full' | 'offline-only' | 'online-only';
  connectivityStatus: {
    online: boolean;
    offline: boolean;
  };
}

// Global sync state (in production, use Redis or database)
let currentSyncStatus: SyncResult | null = null;
let isSyncing = false;

// Helper function to check connection availability
async function checkConnectionAvailability() {
  const results = {
    online: false,
    offline: false
  };

  try {
    await onlinePrisma.$queryRaw`SELECT 1`;
    results.online = true;
    console.log("Online database connection available");
  } catch (error) {
    console.log("Online database connection not available:", error instanceof Error ? error.message : 'Unknown error');
  }

  try {
    await offlinePrisma.$queryRaw`SELECT 1`;
    results.offline = true;
    console.log("Offline database connection available");
  } catch (error) {
    console.log("Offline database connection not available:", error instanceof Error ? error.message : 'Unknown error');
  }

  return results;
}

// Enhanced connection function that doesn't throw on partial failure
async function ensureAvailableConnections(maxRetries = 3) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connectivity = await checkConnectionAvailability();
      
      if (!connectivity.offline && !connectivity.online) {
        throw new Error("Neither online nor offline database connections are available");
      }
      
      if (!connectivity.offline) {
        console.warn("Warning: Offline database not available. Some operations will be skipped.");
      }
      
      if (!connectivity.online) {
        console.warn("Warning: Online database not available. Running in offline mode.");
      }
      
      return connectivity;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown connection error');
      console.error(`Connection attempt ${attempt} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw lastError || new Error("Connection failed after all attempts");
}

// Safe upsert with error handling
async function safeUpsert<T>(
  operation: () => Promise<T>,
  entityName: string,
  entityId: string | number,
  maxRetries = 2
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await operation();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${entityName} upsert failed for ID ${entityId}, attempt ${attempt}:`, errorMessage);
      
      if (attempt === maxRetries) {
        return { success: false, error: errorMessage };
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}

// Update sync progress
function updateProgress(entityName: string, completed: number, total: number, status: SyncProgress['status'], error?: string) {
  if (!currentSyncStatus) return;
  
  const progressIndex = currentSyncStatus.progress.findIndex(p => p.entity === entityName);
  if (progressIndex >= 0) {
    currentSyncStatus.progress[progressIndex] = {
      entity: entityName,
      completed,
      total,
      status,
      error
    };
  }
  
  // Update overall progress
  const completedEntities = currentSyncStatus.progress.filter(p => p.status === 'completed').length;
  const skippedEntities = currentSyncStatus.progress.filter(p => p.status === 'skipped').length;
  currentSyncStatus.completedEntities = completedEntities;
  currentSyncStatus.skippedEntities = skippedEntities;
}

// Sync entities that require online connection (down sync)
async function syncDownstreamEntities(connectivity: { online: boolean; offline: boolean }) {
  if (!connectivity.online || !connectivity.offline) {
    console.log("Skipping downstream sync - online or offline database not available");
    
    // Mark downstream entities as skipped
    const downstreamEntities = ['warehouses', 'users'];
    downstreamEntities.forEach(entity => {
      updateProgress(entity, 0, 0, 'skipped', 'Online database not available');
      currentSyncStatus?.warnings.push(`${entity} sync skipped - online database not available`);
    });
    return;
  }

  // 1. Warehouses (Down sync - online to offline)
  updateProgress('warehouses', 0, 0, 'syncing');
  try {
    console.log("Starting warehouses sync...");
    const warehouses = await onlinePrisma.warehouses_online.findMany();
    updateProgress('warehouses', 0, warehouses.length, 'syncing');
    
    let warehouseErrors = 0;
    await pMap(warehouses, async (data, index) => {
      const result = await safeUpsert(
        () => offlinePrisma.warehouses.upsert({
          where: { warehouseCode: data.warehouseCode },
          update: { ...data, syncedAt: new Date() },
          create: { ...data, syncedAt: new Date() },
        }),
        'warehouses',
        data.warehouseCode
      );
      
      if (!result.success) {
        warehouseErrors++;
        currentSyncStatus?.errors.push(`Warehouse ${data.warehouseCode}: ${result.error}`);
      }
      
      updateProgress('warehouses', index + 1, warehouses.length, 'syncing');
    }, { concurrency: 2 });
    
    updateProgress('warehouses', warehouses.length, warehouses.length, 'completed');
    console.log(`Synced ${warehouses.length - warehouseErrors} warehouses (${warehouseErrors} errors)`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateProgress('warehouses', 0, 0, 'error', errorMessage);
    currentSyncStatus?.errors.push(`Warehouses sync failed: ${errorMessage}`);
  }

  // 2. Users (Down sync - online to offline)
  updateProgress('users', 0, 0, 'syncing');
  try {
    console.log("Starting users sync...");
    const users = await onlinePrisma.users_online.findMany();
    updateProgress('users', 0, users.length, 'syncing');
    
    let userErrors = 0;
    await pMap(users, async (data, index) => {
      const { warehouses_onlineId: warehousesId, ...rest } = data;
      const result = await safeUpsert(
        () => offlinePrisma.users.upsert({
          where: { userName: data.userName },
          update: { ...rest, warehousesId, syncedAt: new Date() },
          create: { ...rest, warehousesId, syncedAt: new Date() },
        }),
        'users',
        data.userName
      );
      
      if (!result.success) {
        userErrors++;
        currentSyncStatus?.errors.push(`User ${data.userName}: ${result.error}`);
      }
      
      updateProgress('users', index + 1, users.length, 'syncing');
    }, { concurrency: 2 });
    
    updateProgress('users', users.length, users.length, 'completed');
    console.log(`Synced ${users.length - userErrors} users (${userErrors} errors)`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateProgress('users', 0, 0, 'error', errorMessage);
    currentSyncStatus?.errors.push(`Users sync failed: ${errorMessage}`);
  }
}

// Sync entities that require offline to online (up sync)


export async function POST(req: NextRequest) {
  // Prevent concurrent syncs
  if (isSyncing) {
    return NextResponse.json({
      status: 409,
      message: "Sync already in progress",
      currentProgress: currentSyncStatus
    }, { status: 409 });
  }

  const body = await req.json();
  console.log("Sync request body:", body);

  // Initialize sync status
  const syncEntities = [
    'warehouses', 'users'
  ];

  isSyncing = true;
  let connectivity = { online: false, offline: false };

  try {
    // Check connectivity first
    connectivity = await ensureAvailableConnections();
    
    // Determine sync mode
    let syncMode: 'full' | 'offline-only' | 'online-only' = 'full';
    if (!connectivity.online && connectivity.offline) {
      syncMode = 'offline-only';
    } else if (connectivity.online && !connectivity.offline) {
      syncMode = 'online-only';
    }

    currentSyncStatus = {
      success: false,
      totalEntities: syncEntities.length,
      completedEntities: 0,
      skippedEntities: 0,
      progress: syncEntities.map(entity => ({
        entity,
        completed: 0,
        total: 0,
        status: 'pending'
      })),
      errors: [],
      warnings: [],
      startTime: new Date(),
      mode: syncMode,
      connectivityStatus: connectivity
    };

    console.log(`Starting sync in ${syncMode} mode`);

    // Perform sync based on available connections
    await syncDownstreamEntities(connectivity);
    

    // Mark sync as completed
    const hasErrors = currentSyncStatus.errors.length > 0;
    const hasWarnings = currentSyncStatus.warnings.length > 0;
    
    currentSyncStatus.success = !hasErrors;
    currentSyncStatus.endTime = new Date();
    currentSyncStatus.duration = currentSyncStatus.endTime.getTime() - currentSyncStatus.startTime.getTime();

    let message = "Sync completed successfully";
    if (hasErrors && hasWarnings) {
      message = "Sync completed with errors and warnings";
    } else if (hasErrors) {
      message = "Sync completed with errors";
    } else if (hasWarnings) {
      message = "Sync completed with warnings";
    }

    console.log("Sync completed", { 
      success: currentSyncStatus.success, 
      errors: currentSyncStatus.errors.length,
      warnings: currentSyncStatus.warnings.length,
      mode: syncMode,
      duration: currentSyncStatus.duration 
    });

    return NextResponse.json({
      status: 200,
      message,
      result: currentSyncStatus
    });

  } catch (error) {
    console.error("Critical sync error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    if (currentSyncStatus) {
      currentSyncStatus.success = false;
      currentSyncStatus.endTime = new Date();
      currentSyncStatus.duration = currentSyncStatus.endTime.getTime() - currentSyncStatus.startTime.getTime();
      currentSyncStatus.errors.push(`Critical error: ${errorMessage}`);
    }

    return NextResponse.json({
      status: 500,
      message: "Sync failed critically",
      error: errorMessage,
      result: currentSyncStatus,
      timestamp: new Date().toISOString()
    }, { status: 500 });

  } finally {
    isSyncing = false;
  }
}

// GET endpoint to check sync status
export async function GET() {
  const overallPercentage = currentSyncStatus ? 
    Math.round(((currentSyncStatus.completedEntities + currentSyncStatus.skippedEntities) / currentSyncStatus.totalEntities) * 100) : 0;

  return NextResponse.json({
    status: 200,
    isSyncing,
    overallPercentage,
    syncStatus: currentSyncStatus,
    lastSync: currentSyncStatus?.endTime || null
  });
}