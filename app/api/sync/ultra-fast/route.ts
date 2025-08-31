import { NextResponse } from "next/server";
import { optimizedSyncService } from "@/lib/sync-optimized";

export async function POST() {
  try {
    console.log("🚀 Starting ultra-fast sync endpoint...");
    
    // Set online status
    optimizedSyncService.setOnlineStatus(true);
    
    // Perform ultra-fast sync
    const result = await optimizedSyncService.performUltraFastSync();
    
    if (result.success) {
      return NextResponse.json({
        status: 200,
        message: "Ultra-fast sync completed successfully",
        metrics: {
          totalTime: result.totalTime,
          totalRecords: result.totalRecords,
          recordsPerSecond: result.recordsPerSecond,
          entityMetrics: result.entityMetrics,
          performance: `${result.recordsPerSecond} records/sec`,
          efficiency: result.totalTime < 5000 ? "Excellent" : 
                     result.totalTime < 15000 ? "Good" : "Needs Optimization"
        },
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 500,
        message: "Ultra-fast sync completed with errors",
        errors: result.errors,
        metrics: {
          totalTime: result.totalTime,
          totalRecords: result.totalRecords,
          recordsPerSecond: result.recordsPerSecond,
          entityMetrics: result.entityMetrics
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error("❌ Ultra-fast sync endpoint error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const isConnectionError = errorMessage.includes("connection") || 
                             errorMessage.includes("connect") || 
                             errorMessage.includes("timeout");
    
    return NextResponse.json({
      status: 500,
      message: "Ultra-fast sync failed",
      error: errorMessage,
      isConnectionError,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint for quick sync status
export async function GET() {
  try {
    const status = await optimizedSyncService.getQuickSyncStatus();
    
    return NextResponse.json({
      success: true,
      ...status,
      recommendation: status.totalUnsynced > 1000 ? 
        "Consider using ultra-fast sync for better performance" :
        status.totalUnsynced > 0 ? 
        "Regular sync recommended" : 
        "All data is synced",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Failed to get sync status:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}