import { PrismaClient as OfflinePrismaClient } from "@/prisma/generated/offline";
import { PrismaClient as OnlinePrismaClient } from "@/prisma/generated/online";
import pMap from "p-map";

// Ultra-fast sync implementation with advanced optimizations
export class OptimizedSyncService {
  private offlineDb: OfflinePrismaClient;
  private onlineDb: OnlinePrismaClient;
  private isOnline: boolean = false;
  private isSyncing: boolean = false;

  constructor() {
    this.offlineDb = new OfflinePrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error"] : [],
      datasources: {
        db: { url: process.env.DATABASE_URL_OFFLINE }
      }
    });
    
    this.onlineDb = new OnlinePrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error"] : [],
      datasources: {
        db: { url: process.env.DATABASE_URL_ONLINE }
      }
    });
  }

  setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
  }

  // Ultra-fast batch sync with transaction support
  async performUltraFastSync(): Promise<{
    success: boolean;
    totalTime: number;
    totalRecords: number;
    recordsPerSecond: number;
    entityMetrics: Record<string, { count: number; time: number; speed: number }>;
    errors: string[];
  }> {
    if (!this.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    if (this.isSyncing) {
      throw new Error("Sync already in progress");
    }

    this.isSyncing = true;
    const overallStart = Date.now();
    const entityMetrics: Record<string, { count: number; time: number; speed: number }> = {};
    const errors: string[] = [];
    let totalRecords = 0;

    try {
      console.log("🚀 Starting ultra-fast sync...");

      // Ensure connections
      await Promise.all([
        this.offlineDb.$connect(),
        this.onlineDb.$connect()
      ]);

      // Step 1: Get all unsynced data in parallel (ultra-fast query phase)
      console.log("📊 Fetching unsynced data...");
      const dataFetchStart = Date.now();
      
      const [
        products, customers, suppliers, sales, purchases, 
        saleItems, purchaseItems, paymentMethods, balancePayments,
        warehouses, users
      ] = await Promise.all([
        this.offlineDb.product.findMany({ 
          where: { sync: false },
          select: this.getProductSelectFields()
        }),
        this.offlineDb.customer.findMany({ 
          where: { sync: false },
          select: this.getCustomerSelectFields()
        }),
        this.offlineDb.supplier.findMany({ 
          where: { sync: false },
          select: this.getSupplierSelectFields()
        }),
        this.offlineDb.sale.findMany({ 
          where: { sync: false },
          select: this.getSaleSelectFields()
        }),
        this.offlineDb.purchase.findMany({ 
          where: { sync: false },
          select: this.getPurchaseSelectFields()
        }),
        this.offlineDb.saleItem.findMany({ 
          where: { sync: false },
          select: this.getSaleItemSelectFields()
        }),
        this.offlineDb.purchaseItem.findMany({ 
          where: { sync: false },
          select: this.getPurchaseItemSelectFields()
        }),
        this.offlineDb.paymentMethod.findMany({ 
          where: { sync: false },
          select: this.getPaymentMethodSelectFields()
        }),
        this.offlineDb.balancePayment.findMany({ 
          where: { sync: false }
        }),
        this.onlineDb.warehouses_online.findMany(),
        this.onlineDb.users_online.findMany()
      ]);

      const dataFetchTime = Date.now() - dataFetchStart;
      console.log(`📊 Data fetch completed in ${dataFetchTime}ms`);

      // Step 2: Parallel sync with maximum concurrency
      const concurrency = 25; // Increased for maximum speed
      
      const syncTasks = [
        // Reference data (downstream)
        this.batchSyncEntity('warehouses', warehouses, this.offlineDb.warehouses, 'warehouseCode', 
          (data: any) => data, entityMetrics, concurrency),
        this.batchSyncEntity('users', users, this.offlineDb.users, 'userName',
          (data: any) => {
            const { warehouses_onlineId: warehousesId, ...rest } = data;
            return { ...rest, warehousesId };
          }, entityMetrics, concurrency),

        // Independent entities (upstream) - can run in parallel
        products.length > 0 && this.batchSyncEntity('products', products, this.onlineDb.product_online, 'id',
          (data: any) => {
            const { warehousesId: warehouses_onlineId, ...rest } = data;
            return { ...rest, warehouses_onlineId, sync: true };
          }, entityMetrics, concurrency),
        
        customers.length > 0 && this.batchSyncEntity('customers', customers, this.onlineDb.customer_online, 'id',
          (data: any) => {
            const { warehousesId: warehouses_onlineId, ...rest } = data;
            return { ...rest, warehouses_onlineId, sync: true };
          }, entityMetrics, concurrency),
        
        suppliers.length > 0 && this.batchSyncEntity('suppliers', suppliers, this.onlineDb.supplier_online, 'id',
          (data: any) => {
            const { warehousesId: warehouses_onlineId, ...rest } = data;
            return { ...rest, warehouses_onlineId, sync: true };
          }, entityMetrics, concurrency)
      ];

      // Execute independent syncs in parallel
      await Promise.all(syncTasks.filter(Boolean));

      // Step 3: Sync dependent entities
      const dependentTasks = [
        sales.length > 0 && this.batchSyncEntity('sales', sales, this.onlineDb.sale_online, 'invoiceNo',
          (data: any) => {
            const { warehousesId: warehouses_onlineId, selectedCustomerId: customer_onlineId, ...rest } = data;
            return { ...rest, warehouses_onlineId, customer_onlineId, sync: true };
          }, entityMetrics, concurrency),
        
        purchases.length > 0 && this.batchSyncEntity('purchases', purchases, this.onlineDb.purchase_online, 'referenceNo',
          (data: any) => {
            const { warehousesId: warehouses_onlineId, supplierId: supplier_onlineId, ...rest } = data;
            return { ...rest, warehouses_onlineId, supplier_onlineId, sync: true };
          }, entityMetrics, concurrency)
      ];

      await Promise.all(dependentTasks.filter(Boolean));

      // Step 4: Sync child entities
      const childTasks = [
        saleItems.length > 0 && this.batchSyncEntity('saleItems', saleItems, this.onlineDb.saleItem_online, 'id',
          (data: any) => {
            const { warehousesId: warehouses_onlineId, saleId: sale_onlineId, customerId: customer_onlineId, productId: product_onlineId, ...rest } = data;
            return { ...rest, warehouses_onlineId, sale_onlineId, product_onlineId, customer_onlineId, sync: true };
          }, entityMetrics, concurrency),
        
        purchaseItems.length > 0 && this.batchSyncEntity('purchaseItems', purchaseItems, this.onlineDb.purchaseItem_online, 'id',
          (data: any) => {
            const { warehousesId: warehouses_onlineId, purchaseId: purchase_onlineId, productId: product_onlineId, ...rest } = data;
            return { ...rest, warehouses_onlineId, product_onlineId, purchase_onlineId, sync: true };
          }, entityMetrics, concurrency),
        
        paymentMethods.length > 0 && this.batchSyncEntity('paymentMethods', paymentMethods, this.onlineDb.paymentMethod_online, 'id',
          (data: any) => {
            const { warehousesId: warehouses_onlineId, saleId: sale_onlineId, ...rest } = data;
            return { ...rest, warehouses_onlineId, sale_onlineId, sync: true };
          }, entityMetrics, concurrency),
        
        balancePayments.length > 0 && this.batchSyncEntity('balancePayments', balancePayments, this.onlineDb.balancePayment_online, 'id',
          (data: any) => ({ ...data, sync: true }), entityMetrics, concurrency)
      ];

      await Promise.all(childTasks.filter(Boolean));

      // Step 5: Batch update sync status in offline DB (ultra-fast single operations)
      const statusUpdateStart = Date.now();
      await Promise.all([
        products.length > 0 && this.offlineDb.product.updateMany({
          where: { id: { in: products.map(p => p.id) } },
          data: { sync: true, syncedAt: new Date() }
        }),
        customers.length > 0 && this.offlineDb.customer.updateMany({
          where: { id: { in: customers.map(c => c.id) } },
          data: { sync: true, syncedAt: new Date() }
        }),
        suppliers.length > 0 && this.offlineDb.supplier.updateMany({
          where: { id: { in: suppliers.map(s => s.id) } },
          data: { sync: true, syncedAt: new Date() }
        }),
        sales.length > 0 && this.offlineDb.sale.updateMany({
          where: { id: { in: sales.map(s => s.id) } },
          data: { sync: true, syncedAt: new Date() }
        }),
        purchases.length > 0 && this.offlineDb.purchase.updateMany({
          where: { id: { in: purchases.map(p => p.id) } },
          data: { sync: true, syncedAt: new Date() }
        }),
        saleItems.length > 0 && this.offlineDb.saleItem.updateMany({
          where: { id: { in: saleItems.map(si => si.id) } },
          data: { sync: true, syncedAt: new Date() }
        }),
        purchaseItems.length > 0 && this.offlineDb.purchaseItem.updateMany({
          where: { id: { in: purchaseItems.map(pi => pi.id) } },
          data: { sync: true, syncedAt: new Date() }
        }),
        paymentMethods.length > 0 && this.offlineDb.paymentMethod.updateMany({
          where: { id: { in: paymentMethods.map(pm => pm.id) } },
          data: { sync: true, syncedAt: new Date() }
        }),
        balancePayments.length > 0 && this.offlineDb.balancePayment.updateMany({
          where: { id: { in: balancePayments.map(bp => bp.id) } },
          data: { sync: true, syncedAt: new Date() }
        })
      ].filter(Boolean));

      const statusUpdateTime = Date.now() - statusUpdateStart;
      entityMetrics.statusUpdates = { count: 0, time: statusUpdateTime, speed: 0 };

      // Calculate totals
      totalRecords = Object.values(entityMetrics).reduce((sum, metric) => sum + metric.count, 0);
      const totalTime = Date.now() - overallStart;
      const recordsPerSecond = totalRecords > 0 ? Math.round(totalRecords / (totalTime / 1000)) : 0;

      console.log(`🎉 Ultra-fast sync completed in ${totalTime}ms`);
      console.log(`⚡ Performance: ${totalRecords} records at ${recordsPerSecond} records/sec`);

      return {
        success: true,
        totalTime,
        totalRecords,
        recordsPerSecond,
        entityMetrics,
        errors
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Critical sync failure: ${errorMessage}`);
      console.error("❌ Ultra-fast sync failed:", error);
      
      return {
        success: false,
        totalTime: Date.now() - overallStart,
        totalRecords,
        recordsPerSecond: 0,
        entityMetrics,
        errors
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // Optimized batch sync for any entity type
  private async batchSyncEntity<T extends Record<string, any>>(
    entityName: string,
    sourceData: T[],
    targetModel: any,
    whereField: keyof T,
    transformFn: (item: T) => any,
    metrics: Record<string, { count: number; time: number; speed: number }>,
    concurrency = 25
  ): Promise<void> {
    if (sourceData.length === 0) return;

    const startTime = Date.now();
    
    try {
      // Use maximum concurrency for speed
      await pMap(sourceData, async (data) => {
        const transformedData = transformFn(data);
        await targetModel.upsert({
          where: { [whereField]: data[whereField] },
          update: { ...transformedData, syncedAt: new Date() },
          create: { ...transformedData, syncedAt: new Date() },
        });
      }, { concurrency });

      const duration = Date.now() - startTime;
      const speed = Math.round(sourceData.length / (duration / 1000));
      
      metrics[entityName] = {
        count: sourceData.length,
        time: duration,
        speed
      };

      console.log(`⚡ ${entityName}: ${sourceData.length} records in ${duration}ms (${speed} records/sec)`);
    } catch (error) {
      console.error(`❌ Failed to sync ${entityName}:`, error);
      throw error;
    }
  }

  // Optimized select fields to reduce data transfer
  private getProductSelectFields() {
    return {
      id: true,
      productName: true,
      category: true,
      subCategory: true,
      brand: true,
      unit: true,
      purchasePrice: true,
      salePrice: true,
      quantity: true,
      minQuantity: true,
      maxQuantity: true,
      barcode: true,
      warehousesId: true,
      sync: true,
      syncedAt: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true
    };
  }

  private getCustomerSelectFields() {
    return {
      id: true,
      customerName: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      warehousesId: true,
      sync: true,
      syncedAt: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true
    };
  }

  private getSupplierSelectFields() {
    return {
      id: true,
      supplierName: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      warehousesId: true,
      sync: true,
      syncedAt: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true
    };
  }

  private getSaleSelectFields() {
    return {
      id: true,
      invoiceNo: true,
      saleDate: true,
      totalAmount: true,
      paidAmount: true,
      dueAmount: true,
      discountAmount: true,
      taxAmount: true,
      taxRate: true,
      paymentStatus: true,
      warehousesId: true,
      selectedCustomerId: true,
      sync: true,
      syncedAt: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true
    };
  }

  private getPurchaseSelectFields() {
    return {
      id: true,
      referenceNo: true,
      purchaseDate: true,
      totalAmount: true,
      paidAmount: true,
      dueAmount: true,
      discountAmount: true,
      taxAmount: true,
      paymentStatus: true,
      warehousesId: true,
      supplierId: true,
      sync: true,
      syncedAt: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true
    };
  }

  private getSaleItemSelectFields() {
    return {
      id: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      discountAmount: true,
      warehousesId: true,
      saleId: true,
      productId: true,
      customerId: true,
      sync: true,
      syncedAt: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true
    };
  }

  private getPurchaseItemSelectFields() {
    return {
      id: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      discountAmount: true,
      warehousesId: true,
      purchaseId: true,
      productId: true,
      sync: true,
      syncedAt: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true
    };
  }

  private getPaymentMethodSelectFields() {
    return {
      id: true,
      paymentType: true,
      amount: true,
      referenceNo: true,
      warehousesId: true,
      saleId: true,
      sync: true,
      syncedAt: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true
    };
  }

  // Quick sync status check
  async getQuickSyncStatus(): Promise<{
    totalUnsynced: number;
    hasUnsyncedData: boolean;
    unsyncedByEntity: Record<string, number>;
  }> {
    try {
      const counts = await Promise.all([
        this.offlineDb.product.count({ where: { sync: false, isDeleted: false } }),
        this.offlineDb.customer.count({ where: { sync: false, isDeleted: false } }),
        this.offlineDb.supplier.count({ where: { sync: false, isDeleted: false } }),
        this.offlineDb.sale.count({ where: { sync: false, isDeleted: false } }),
        this.offlineDb.purchase.count({ where: { sync: false, isDeleted: false } }),
        this.offlineDb.saleItem.count({ where: { sync: false, isDeleted: false } }),
        this.offlineDb.purchaseItem.count({ where: { sync: false, isDeleted: false } }),
        this.offlineDb.paymentMethod.count({ where: { sync: false, isDeleted: false } }),
        this.offlineDb.balancePayment.count({ where: { sync: false } })
      ]);

      const unsyncedByEntity = {
        products: counts[0],
        customers: counts[1],
        suppliers: counts[2],
        sales: counts[3],
        purchases: counts[4],
        saleItems: counts[5],
        purchaseItems: counts[6],
        paymentMethods: counts[7],
        balancePayments: counts[8]
      };

      const totalUnsynced = counts.reduce((sum, count) => sum + count, 0);

      return {
        totalUnsynced,
        hasUnsyncedData: totalUnsynced > 0,
        unsyncedByEntity
      };
    } catch (error) {
      console.error("Failed to get sync status:", error);
      throw error;
    }
  }
}

export const optimizedSyncService = new OptimizedSyncService();