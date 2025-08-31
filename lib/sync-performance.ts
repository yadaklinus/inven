// Advanced sync performance monitoring and benchmarking
export interface SyncBenchmark {
  timestamp: Date;
  syncMode: 'regular' | 'ultra-fast';
  totalTime: number;
  totalRecords: number;
  recordsPerSecond: number;
  entityBreakdown: Record<string, {
    count: number;
    time: number;
    speed: number;
  }>;
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
  networkLatency?: number;
  databaseLatency?: {
    offline: number;
    online: number;
  };
}

export class SyncPerformanceMonitor {
  private benchmarks: SyncBenchmark[] = [];
  private readonly maxBenchmarksStored = 50;

  // Record a new benchmark
  recordBenchmark(benchmark: Omit<SyncBenchmark, 'timestamp'>): void {
    const fullBenchmark: SyncBenchmark = {
      ...benchmark,
      timestamp: new Date()
    };

    this.benchmarks.unshift(fullBenchmark);
    
    // Keep only the most recent benchmarks
    if (this.benchmarks.length > this.maxBenchmarksStored) {
      this.benchmarks = this.benchmarks.slice(0, this.maxBenchmarksStored);
    }

    // Log performance insights
    this.logPerformanceInsights(fullBenchmark);
  }

  // Get performance analytics
  getPerformanceAnalytics(): {
    averageSpeed: number;
    fastestSync: SyncBenchmark;
    slowestSync: SyncBenchmark;
    recentTrend: 'improving' | 'declining' | 'stable';
    recommendations: string[];
    totalSyncsRecorded: number;
    averageSyncTime: number;
  } {
    if (this.benchmarks.length === 0) {
      return {
        averageSpeed: 0,
        fastestSync: {} as SyncBenchmark,
        slowestSync: {} as SyncBenchmark,
        recentTrend: 'stable',
        recommendations: ['No sync data available'],
        totalSyncsRecorded: 0,
        averageSyncTime: 0
      };
    }

    const speeds = this.benchmarks.map(b => b.recordsPerSecond);
    const times = this.benchmarks.map(b => b.totalTime);
    
    const averageSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    const averageSyncTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    
    const fastestSync = this.benchmarks.reduce((fastest, current) => 
      current.recordsPerSecond > fastest.recordsPerSecond ? current : fastest
    );
    
    const slowestSync = this.benchmarks.reduce((slowest, current) => 
      current.recordsPerSecond < slowest.recordsPerSecond ? current : slowest
    );

    // Analyze recent trend (last 5 vs previous 5)
    const recentTrend = this.analyzePerformanceTrend();
    
    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      averageSpeed: Math.round(averageSpeed),
      fastestSync,
      slowestSync,
      recentTrend,
      recommendations,
      totalSyncsRecorded: this.benchmarks.length,
      averageSyncTime: Math.round(averageSyncTime)
    };
  }

  // Analyze performance trend
  private analyzePerformanceTrend(): 'improving' | 'declining' | 'stable' {
    if (this.benchmarks.length < 6) return 'stable';

    const recent5 = this.benchmarks.slice(0, 5);
    const previous5 = this.benchmarks.slice(5, 10);

    const recentAvg = recent5.reduce((sum, b) => sum + b.recordsPerSecond, 0) / recent5.length;
    const previousAvg = previous5.reduce((sum, b) => sum + b.recordsPerSecond, 0) / previous5.length;

    const improvement = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (improvement > 10) return 'improving';
    if (improvement < -10) return 'declining';
    return 'stable';
  }

  // Generate performance recommendations
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.benchmarks.length === 0) {
      return ['No sync data available for analysis'];
    }

    const latestBenchmark = this.benchmarks[0];
    const analytics = this.getPerformanceAnalytics();

    // Speed recommendations
    if (analytics.averageSpeed < 20) {
      recommendations.push('Consider using ultra-fast sync mode for better performance');
    }

    if (latestBenchmark.totalTime > 30000) {
      recommendations.push('Sync taking too long - check network connectivity and database performance');
    }

    // Mode recommendations
    const ultraFastCount = this.benchmarks.filter(b => b.syncMode === 'ultra-fast').length;
    const regularCount = this.benchmarks.filter(b => b.syncMode === 'regular').length;
    
    if (ultraFastCount > 0 && regularCount > 0) {
      const ultraFastAvg = this.benchmarks
        .filter(b => b.syncMode === 'ultra-fast')
        .reduce((sum, b) => sum + b.recordsPerSecond, 0) / ultraFastCount;
      
      const regularAvg = this.benchmarks
        .filter(b => b.syncMode === 'regular')
        .reduce((sum, b) => sum + b.recordsPerSecond, 0) / regularCount;

      if (ultraFastAvg > regularAvg * 1.5) {
        recommendations.push('Ultra-fast mode shows significant performance gains - consider using it by default');
      }
    }

    // Trend recommendations
    if (analytics.recentTrend === 'declining') {
      recommendations.push('Performance is declining - check for database optimization opportunities');
    }

    // Entity-specific recommendations
    if (latestBenchmark.entityBreakdown) {
      const slowestEntity = Object.entries(latestBenchmark.entityBreakdown)
        .reduce((slowest, [name, metrics]) => 
          metrics.speed < slowest.speed ? { name, speed: metrics.speed } : slowest,
          { name: '', speed: Infinity }
        );

      if (slowestEntity.speed < 10) {
        recommendations.push(`${slowestEntity.name} sync is slow - consider optimizing queries or increasing concurrency`);
      }
    }

    return recommendations.length > 0 ? recommendations : ['Performance is optimal'];
  }

  // Log performance insights
  private logPerformanceInsights(benchmark: SyncBenchmark): void {
    const { totalTime, totalRecords, recordsPerSecond, syncMode } = benchmark;
    
    console.log(`📊 Sync Performance Report (${syncMode} mode):`);
    console.log(`   ⏱️  Total Time: ${totalTime}ms`);
    console.log(`   📦 Total Records: ${totalRecords}`);
    console.log(`   ⚡ Speed: ${recordsPerSecond} records/sec`);
    
    if (benchmark.entityBreakdown) {
      console.log(`   🔍 Entity Breakdown:`);
      Object.entries(benchmark.entityBreakdown).forEach(([entity, metrics]) => {
        console.log(`      ${entity}: ${metrics.count} records in ${metrics.time}ms (${metrics.speed} rps)`);
      });
    }

    // Performance rating
    let rating = "Unknown";
    if (recordsPerSecond > 100) rating = "🚀 Excellent";
    else if (recordsPerSecond > 50) rating = "✅ Good";
    else if (recordsPerSecond > 20) rating = "⚠️  Average";
    else rating = "🐌 Needs Optimization";
    
    console.log(`   📈 Performance Rating: ${rating}`);
  }

  // Get recent benchmarks
  getRecentBenchmarks(count = 10): SyncBenchmark[] {
    return this.benchmarks.slice(0, count);
  }

  // Get benchmarks for a specific mode
  getBenchmarksByMode(mode: 'regular' | 'ultra-fast'): SyncBenchmark[] {
    return this.benchmarks.filter(b => b.syncMode === mode);
  }

  // Clear all benchmarks
  clearBenchmarks(): void {
    this.benchmarks = [];
    console.log("🗑️  Cleared all sync benchmarks");
  }

  // Export benchmarks as JSON
  exportBenchmarks(): string {
    return JSON.stringify(this.benchmarks, null, 2);
  }

  // Get performance summary
  getPerformanceSummary(): {
    totalSyncs: number;
    averageTime: number;
    averageSpeed: number;
    bestSpeed: number;
    worstSpeed: number;
    ultraFastUsage: number;
    regularUsage: number;
  } {
    if (this.benchmarks.length === 0) {
      return {
        totalSyncs: 0,
        averageTime: 0,
        averageSpeed: 0,
        bestSpeed: 0,
        worstSpeed: 0,
        ultraFastUsage: 0,
        regularUsage: 0
      };
    }

    const times = this.benchmarks.map(b => b.totalTime);
    const speeds = this.benchmarks.map(b => b.recordsPerSecond);
    
    return {
      totalSyncs: this.benchmarks.length,
      averageTime: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
      averageSpeed: Math.round(speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length),
      bestSpeed: Math.max(...speeds),
      worstSpeed: Math.min(...speeds),
      ultraFastUsage: this.benchmarks.filter(b => b.syncMode === 'ultra-fast').length,
      regularUsage: this.benchmarks.filter(b => b.syncMode === 'regular').length
    };
  }
}

// Global performance monitor instance
export const syncPerformanceMonitor = new SyncPerformanceMonitor();

// Utility function to measure database latency
export async function measureDatabaseLatency(): Promise<{
  offline: number;
  online: number;
}> {
  const { PrismaClient: OfflinePrismaClient } = await import("@/prisma/generated/offline");
  const { PrismaClient: OnlinePrismaClient } = await import("@/prisma/generated/online");
  
  const offlineDb = new OfflinePrismaClient();
  const onlineDb = new OnlinePrismaClient();

  try {
    // Measure offline DB latency
    const offlineStart = Date.now();
    await offlineDb.$queryRaw`SELECT 1`;
    const offlineLatency = Date.now() - offlineStart;

    // Measure online DB latency
    const onlineStart = Date.now();
    await onlineDb.$queryRaw`SELECT 1`;
    const onlineLatency = Date.now() - onlineStart;

    return {
      offline: offlineLatency,
      online: onlineLatency
    };
  } finally {
    await offlineDb.$disconnect();
    await onlineDb.$disconnect();
  }
}