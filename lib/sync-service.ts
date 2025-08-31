import { PrismaClient as OfflinePrismaClient } from "@/prisma/generated/offline";
import { PrismaClient as OnlinePrismaClient } from "@/prisma/generated/online";
import pMap from "p-map";

// Optimized database clients with connection pooling
const offlineDb = new OfflinePrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL_OFFLINE
    }
  }
});

const onlineDb = new OnlinePrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL_ONLINE
    }
  }
});

// Enhanced connection management with retry logic
async function ensureConnections(retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await Promise.all([
        offlineDb.$connect(),
        onlineDb.$connect()
      ]);
      console.log("Sync service: Both database clients connected successfully");
      return;
    } catch (error) {
      console.error(`Sync service: Connection attempt ${attempt}/${retries} failed:`, error);
      if (attempt === retries) {
        throw new Error(`Database connection failed after ${retries} attempts`);
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
}

// Initialize connections with error handling
ensureConnections().catch(error => {
  console.error("Critical: Failed to initialize database connections:", error);
});

export interface SyncResult {
  success: boolean;
  syncedTables: string[];
  errors: string[];
  totalSynced: number;
  metrics: {
    totalTime: number;
    entityTimes: Record<string, number>;
    recordsPerSecond: number;
  };
  timestamp: string;
}

interface BatchSyncOptions {
  concurrency?: number;
  batchSize?: number;
  enableMetrics?: boolean;
}

export class DataSyncService {
  private isOnline: boolean = false;
  private isSyncing: boolean = false;

  constructor(isOnline: boolean = false) {
    this.isOnline = isOnline;
  }

  setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
  }

  async syncAllData(options: BatchSyncOptions = {}): Promise<SyncResult> {
    const { 
      concurrency = 15, 
      batchSize = 1000, 
      enableMetrics = true 
    } = options;

    if (!this.isOnline) {
      return {
        success: false,
        syncedTables: [],
        errors: ["No internet connection"],
        totalSynced: 0,
        metrics: { totalTime: 0, entityTimes: {}, recordsPerSecond: 0 },
        timestamp: new Date().toISOString()
      };
    }

    if (this.isSyncing) {
      return {
        success: false,
        syncedTables: [],
        errors: ["Sync already in progress"],
        totalSynced: 0,
        metrics: { totalTime: 0, entityTimes: {}, recordsPerSecond: 0 },
        timestamp: new Date().toISOString()
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      syncedTables: [],
      errors: [],
      totalSynced: 0,
      metrics: { totalTime: 0, entityTimes: {}, recordsPerSecond: 0 },
      timestamp: new Date().toISOString()
    };

    try {
      console.log("🚀 Starting optimized sync service...");
      
      // Ensure database connections before starting
      await ensureConnections();
      
      // Test connections with timeout
      await Promise.race([
        Promise.all([
          offlineDb.$queryRaw`SELECT 1`,
          onlineDb.$queryRaw`SELECT 1`
        ]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection test timeout')), 5000)
        )
      ]);

      // Parallel sync operations for better performance
      const syncOperations = [
        // Downstream sync (online -> offline) - reference data
        this.syncDownstreamData(result, { concurrency, batchSize }),
        // Upstream sync (offline -> online) - transactional data
        this.syncUpstreamData(result, { concurrency, batchSize })
      ];

      const syncResults = await Promise.allSettled(syncOperations);
      
      // Handle any sync failures
      syncResults.forEach((syncResult, index) => {
        if (syncResult.status === 'rejected') {
          const syncType = index === 0 ? 'downstream' : 'upstream';
          result.errors.push(`${syncType} sync failed: ${syncResult.reason}`);
        }
      });

      result.success = result.errors.length === 0;
      
      // Calculate final metrics
      const totalTime = Date.now() - startTime;
      result.metrics.totalTime = totalTime;
      result.metrics.recordsPerSecond = result.totalSynced > 0 ? 
        Math.round(result.totalSynced / (totalTime / 1000)) : 0;

      console.log(`🎉 Sync service completed in ${totalTime}ms`);
      console.log(`📊 Performance: ${result.totalSynced} records at ${result.metrics.recordsPerSecond} records/sec`);
      
    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Critical sync failure: ${errorMessage}`);
      console.error("❌ Sync service critical error:", error);
    } finally {
      this.isSyncing = false;
      result.metrics.totalTime = Date.now() - startTime;
    }

    return result;
  }

  // Optimized downstream sync (online -> offline)
  private async syncDownstreamData(result: SyncResult, options: BatchSyncOptions): Promise<void> {
    console.log("⬇️  Sync service: Starting downstream sync...");
    
    // Sync reference data in parallel
    await Promise.all([
      this.syncWarehouses(result, options),
      this.syncUsers(result, options)
    ]);
  }

  // Optimized upstream sync (offline -> online)
  private async syncUpstreamData(result: SyncResult, options: BatchSyncOptions): Promise<void> {
    console.log("⬆️  Sync service: Starting upstream sync...");
    
    // Sync in dependency order but with parallel processing where possible
    await Promise.all([
      this.syncCustomers(result, options),
      this.syncSuppliers(result, options),
      this.syncProducts(result, options),
      this.syncReceiptSettings(result, options),
      this.syncSettings(result, options),
      this.syncSuperAdmins(result, options)
    ]);

    // Sync dependent entities after their dependencies
    await Promise.all([
      this.syncSales(result, options),
      this.syncPurchases(result, options)
    ]);

    // Sync items that depend on sales/purchases
    await Promise.all([
      this.syncSaleItems(result, options),
      this.syncPurchaseItems(result, options),
      this.syncPaymentMethods(result, options)
    ]);
  }

  private async syncWarehouses(result: SyncResult, options: BatchSyncOptions): Promise<void> {
    const entityStart = Date.now();
    try {
      const warehouses = await onlineDb.warehouses_online.findMany();

      if (warehouses.length > 0) {
        await pMap(warehouses, async (warehouse) => {
          const { sync, syncedAt, ...warehouseData } = warehouse;
          
          await offlineDb.warehouses.upsert({
            where: { warehouseCode: warehouse.warehouseCode },
            update: {
              ...warehouseData,
              sync: true,
              syncedAt: new Date()
            },
            create: {
              ...warehouseData,
              sync: true,
              syncedAt: new Date()
            }
          });
        }, { concurrency: options.concurrency || 15 });

        result.totalSynced += warehouses.length;
        result.syncedTables.push(`Warehouses (${warehouses.length})`);
        
        const duration = Date.now() - entityStart;
        result.metrics.entityTimes.warehouses = duration;
        console.log(`✅ Synced ${warehouses.length} warehouses in ${duration}ms`);
      }
    } catch (error) {
      result.errors.push(`Warehouses sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error("❌ Warehouses sync error:", error);
    }
  }

  private async syncUsers(result: SyncResult, options: BatchSyncOptions): Promise<void> {
    const entityStart = Date.now();
    try {
      const users = await onlineDb.users_online.findMany();

      if (users.length > 0) {
        await pMap(users, async (user) => {
          const { sync, syncedAt, warehouses_onlineId, ...userData } = user;
          
          await offlineDb.users.upsert({
            where: { userName: user.userName },
            update: {
              ...userData,
              warehousesId: warehouses_onlineId,
              sync: true,
              syncedAt: new Date()
            },
            create: {
              ...userData,
              warehousesId: warehouses_onlineId,
              sync: true,
              syncedAt: new Date()
            }
          });
        }, { concurrency: options.concurrency || 15 });

        result.totalSynced += users.length;
        result.syncedTables.push(`Users (${users.length})`);
        
        const duration = Date.now() - entityStart;
        result.metrics.entityTimes.users = duration;
        console.log(`✅ Synced ${users.length} users in ${duration}ms`);
      }
    } catch (error) {
      result.errors.push(`Users sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error("❌ Users sync error:", error);
    }
  }

  private async syncCustomers(result: SyncResult) {
    try {
      const unsyncedCustomers = await offlineDb.customer.findMany({
        where: { sync: false }
      });

      for (const customer of unsyncedCustomers) {
        const { sync, syncedAt, warehousesId, ...customerData } = customer;
        
        await onlineDb.customer_online.upsert({
          where: { id: customer.id },
          update: {
            ...customerData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...customerData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.customer.update({
          where: { id: customer.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedCustomers.length > 0) {
        result.syncedTables.push(`Customers (${unsyncedCustomers.length})`);
      }
    } catch (error) {
      result.errors.push(`Customers sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncSuppliers(result: SyncResult) {
    try {
      const unsyncedSuppliers = await offlineDb.supplier.findMany({
        where: { sync: false }
      });

      for (const supplier of unsyncedSuppliers) {
        const { sync, syncedAt, warehousesId, ...supplierData } = supplier;
        
        await onlineDb.supplier_online.upsert({
          where: { id: supplier.id },
          update: {
            ...supplierData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...supplierData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.supplier.update({
          where: { id: supplier.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedSuppliers.length > 0) {
        result.syncedTables.push(`Suppliers (${unsyncedSuppliers.length})`);
      }
    } catch (error) {
      result.errors.push(`Suppliers sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncProducts(result: SyncResult) {
    try {
      const unsyncedProducts = await offlineDb.product.findMany({
        where: { sync: false }
      });

      for (const product of unsyncedProducts) {
        const { sync, syncedAt, warehousesId, ...productData } = product;
        
        await onlineDb.product_online.upsert({
          where: { id: product.id },
          update: {
            ...productData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...productData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.product.update({
          where: { id: product.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedProducts.length > 0) {
        result.syncedTables.push(`Products (${unsyncedProducts.length})`);
      }
    } catch (error) {
      result.errors.push(`Products sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncSales(result: SyncResult) {
    try {
      const unsyncedSales = await offlineDb.sale.findMany({
        where: { sync: false }
      });

      for (const sale of unsyncedSales) {
        const { sync, syncedAt, warehousesId,taxRate, selectedCustomerId, ...saleData } = sale;
        
        await onlineDb.sale_online.upsert({
          where: { invoiceNo: sale.invoiceNo,taxRate },
          update: {
            ...saleData,
            warehouses_onlineId: warehousesId,
            customer_onlineId: selectedCustomerId,
            sync: true,
            taxRate,
            syncedAt: new Date()
          },
          create: {
            ...saleData,
            warehouses_onlineId: warehousesId,
            customer_onlineId: selectedCustomerId,
            taxRate,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.sale.update({
          where: { id: sale.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedSales.length > 0) {
        result.syncedTables.push(`Sales (${unsyncedSales.length})`);
      }
    } catch (error) {
      result.errors.push(`Sales sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncSaleItems(result: SyncResult) {
    try {
      const unsyncedSaleItems = await offlineDb.saleItem.findMany({
        where: { sync: false }
      });

      for (const saleItem of unsyncedSaleItems) {
        const { sync, syncedAt, warehousesId, productId, customerId, saleId, ...saleItemData } = saleItem;
        
        await onlineDb.saleItem_online.upsert({
          where: { id: saleItem.id },
          update: {
            ...saleItemData,
            warehouses_onlineId: warehousesId,
            product_onlineId: productId,
            customer_onlineId: customerId,
            sale_onlineId: saleId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...saleItemData,
            warehouses_onlineId: warehousesId,
            product_onlineId: productId,
            customer_onlineId: customerId,
            sale_onlineId: saleId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.saleItem.update({
          where: { id: saleItem.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedSaleItems.length > 0) {
        result.syncedTables.push(`Sale Items (${unsyncedSaleItems.length})`);
      }
    } catch (error) {
      result.errors.push(`Sale Items sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncPurchases(result: SyncResult) {
    try {
      const unsyncedPurchases = await offlineDb.purchase.findMany({
        where: { sync: false }
      });

      for (const purchase of unsyncedPurchases) {
        const { sync, syncedAt, warehousesId, supplierId, ...purchaseData } = purchase;
        
        await onlineDb.purchase_online.upsert({
          where: { referenceNo: purchase.referenceNo },
          update: {
            ...purchaseData,
            warehouses_onlineId: warehousesId,
            supplier_onlineId: supplierId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...purchaseData,
            warehouses_onlineId: warehousesId,
            supplier_onlineId: supplierId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.purchase.update({
          where: { id: purchase.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedPurchases.length > 0) {
        result.syncedTables.push(`Purchases (${unsyncedPurchases.length})`);
      }
    } catch (error) {
      result.errors.push(`Purchases sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncPurchaseItems(result: SyncResult) {
    try {
      const unsyncedPurchaseItems = await offlineDb.purchaseItem.findMany({
        where: { sync: false }
      });

      for (const purchaseItem of unsyncedPurchaseItems) {
        const { sync, syncedAt, warehousesId, productId, purchaseId,productName, ...purchaseItemData } = purchaseItem;
        
        await onlineDb.purchaseItem_online.upsert({
          where: { id: purchaseItem.id },
          update: {
            ...purchaseItemData,
            warehouses_onlineId: warehousesId,
            product_onlineId: productId,
            purchase_onlineId: purchaseId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...purchaseItemData,
            warehouses_onlineId: warehousesId,
            product_onlineId: productId,
            purchase_onlineId: purchaseId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.purchaseItem.update({
          where: { id: purchaseItem.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedPurchaseItems.length > 0) {
        result.syncedTables.push(`Purchase Items (${unsyncedPurchaseItems.length})`);
      }
    } catch (error) {
      result.errors.push(`Purchase Items sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncPaymentMethods(result: SyncResult) {
    try {
      const unsyncedPaymentMethods = await offlineDb.paymentMethod.findMany({
        where: { sync: false }
      });

      for (const paymentMethod of unsyncedPaymentMethods) {
        const { sync, syncedAt, warehousesId, saleId, ...paymentMethodData } = paymentMethod;
        
        await onlineDb.paymentMethod_online.upsert({
          where: { id: paymentMethod.id },
          update: {
            ...paymentMethodData,
            warehouses_onlineId: warehousesId,
            sale_onlineId: saleId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...paymentMethodData,
            warehouses_onlineId: warehousesId,
            sale_onlineId: saleId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.paymentMethod.update({
          where: { id: paymentMethod.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedPaymentMethods.length > 0) {
        result.syncedTables.push(`Payment Methods (${unsyncedPaymentMethods.length})`);
      }
    } catch (error) {
      result.errors.push(`Payment Methods sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncReceiptSettings(result: SyncResult) {
    try {
      const unsyncedReceiptSettings = await offlineDb.receiptSettings.findMany({
        where: { sync: false }
      });

      for (const receiptSetting of unsyncedReceiptSettings) {
        const { sync, syncedAt, warehousesId, ...receiptSettingData } = receiptSetting;
        
        await onlineDb.receiptSettings_online.upsert({
          where: { id: receiptSetting.id },
          update: {
            ...receiptSettingData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...receiptSettingData,
            warehouses_onlineId: warehousesId,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.receiptSettings.update({
          where: { id: receiptSetting.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedReceiptSettings.length > 0) {
        result.syncedTables.push(`Receipt Settings (${unsyncedReceiptSettings.length})`);
      }
    } catch (error) {
      result.errors.push(`Receipt Settings sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncSettings(result: SyncResult) {
    try {
      const unsyncedSettings = await offlineDb.settings.findMany({
        where: { sync: false }
      });

      for (const setting of unsyncedSettings) {
        const { sync, syncedAt, ...settingData } = setting;
        
        await onlineDb.settings_online.upsert({
          where: { setting_id: setting.setting_id },
          update: {
            ...settingData,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...settingData,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.settings.update({
          where: { setting_id: setting.setting_id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedSettings.length > 0) {
        result.syncedTables.push(`Settings (${unsyncedSettings.length})`);
      }
    } catch (error) {
      result.errors.push(`Settings sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async syncSuperAdmins(result: SyncResult) {
    try {
      const unsyncedSuperAdmins = await offlineDb.superAdmin.findMany({
        where: { sync: false }
      });

      for (const superAdmin of unsyncedSuperAdmins) {
        const { sync, syncedAt, ...superAdminData } = superAdmin;
        
        await onlineDb.superAdmin_online.upsert({
          where: { email: superAdmin.email },
          update: {
            ...superAdminData,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            ...superAdminData,
            sync: true,
            syncedAt: new Date()
          }
        });

        await offlineDb.superAdmin.update({
          where: { id: superAdmin.id },
          data: { sync: true, syncedAt: new Date() }
        });

        result.totalSynced++;
      }

      if (unsyncedSuperAdmins.length > 0) {
        result.syncedTables.push(`Super Admins (${unsyncedSuperAdmins.length})`);
      }
    } catch (error) {
      result.errors.push(`Super Admins sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSyncStatus() {
    try {
      const counts = await Promise.all([
        offlineDb.warehouses.count({ where: { sync: false } }),
        offlineDb.users.count({ where: { sync: false } }),
        offlineDb.customer.count({ where: { sync: false } }),
        offlineDb.supplier.count({ where: { sync: false } }),
        offlineDb.product.count({ where: { sync: false } }),
        offlineDb.sale.count({ where: { sync: false } }),
        offlineDb.saleItem.count({ where: { sync: false } }),
        offlineDb.purchase.count({ where: { sync: false } }),
        offlineDb.purchaseItem.count({ where: { sync: false } }),
        offlineDb.paymentMethod.count({ where: { sync: false } }),
        offlineDb.receiptSettings.count({ where: { sync: false } }),
        offlineDb.settings.count({ where: { sync: false } }),
        offlineDb.superAdmin.count({ where: { sync: false } })
      ]);

      const totalUnsynced = counts.reduce((sum, count) => sum + count, 0);

      return {
        totalUnsynced,
        unsyncedTables: {
          warehouses: counts[0],
          users: counts[1],
          customers: counts[2],
          suppliers: counts[3],
          products: counts[4],
          sales: counts[5],
          saleItems: counts[6],
          purchases: counts[7],
          purchaseItems: counts[8],
          paymentMethods: counts[9],
          receiptSettings: counts[10],
          settings: counts[11],
          superAdmins: counts[12]
        }
      };
    } catch (error) {
      throw new Error(`Failed to get sync status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const dataSyncService = new DataSyncService();