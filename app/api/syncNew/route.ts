import { NextResponse } from "next/server";
import pMap from "p-map";

import onlinePrisma from "@/lib/onlinePrisma";
import offlinePrisma from "@/lib/oflinePrisma";

// Performance monitoring
interface SyncMetrics {
  startTime: number;
  entityTimes: Record<string, number>;
  totalRecords: number;
  errors: string[];
}

// Helper function to ensure database connections with retry logic
async function ensureConnections(retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await Promise.all([
        onlinePrisma.$connect(),
        offlinePrisma.$connect()
      ]);
      console.log("Both Prisma clients connected successfully");
      return;
    } catch (error) {
      console.error(`Connection attempt ${attempt}/${retries} failed:`, error);
      if (attempt === retries) {
        throw new Error(`Database connection failed after ${retries} attempts`);
      }
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
}

// Helper function to test connections with timeout
async function testConnections(): Promise<void> {
  try {
    const timeout = 5000; // 5 second timeout
    await Promise.race([
      Promise.all([
        onlinePrisma.$queryRaw`SELECT 1`,
        offlinePrisma.$queryRaw`SELECT 1`
      ]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection test timeout')), timeout)
      )
    ]);
    console.log("Database connections tested successfully");
  } catch (error) {
    console.error("Database connection test failed:", error);
    throw new Error("Database connection test failed");
  }
}

// Optimized batch upsert function
async function batchUpsert<T extends Record<string, any>>(
  sourceData: T[],
  targetModel: any,
  whereField: keyof T,
  transformFn: (item: T) => any,
  entityName: string,
  concurrency = 10
): Promise<number> {
  if (sourceData.length === 0) return 0;

  const startTime = Date.now();
  
  // Use higher concurrency for better performance
  await pMap(sourceData, async (data) => {
    const transformedData = transformFn(data);
    await targetModel.upsert({
      where: { [whereField]: data[whereField] },
      update: { ...transformedData, syncedAt: new Date() },
      create: { ...transformedData, syncedAt: new Date() },
    });
  }, { concurrency });

  const duration = Date.now() - startTime;
  console.log(`✅ Synced ${sourceData.length} ${entityName} in ${duration}ms (${Math.round(sourceData.length / (duration / 1000))} records/sec)`);
  
  return sourceData.length;
}

export async function POST() {
  const metrics: SyncMetrics = {
    startTime: Date.now(),
    entityTimes: {},
    totalRecords: 0,
    errors: []
  };

  try {
    console.log("🚀 Starting optimized sync process...");
    
    // Ensure connections with retry logic
    await ensureConnections();
    await testConnections();

    // Use transactions for better performance and consistency
    const results = await Promise.allSettled([
      syncDownstreamData(metrics),
      syncUpstreamData(metrics)
    ]);

    // Check for any failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      failures.forEach((failure, index) => {
        const syncType = index === 0 ? 'downstream' : 'upstream';
        metrics.errors.push(`${syncType} sync failed: ${failure.reason}`);
      });
    }

    const totalTime = Date.now() - metrics.startTime;
    const recordsPerSecond = Math.round(metrics.totalRecords / (totalTime / 1000));

    console.log(`🎉 Sync completed in ${totalTime}ms`);
    console.log(`📊 Performance: ${metrics.totalRecords} records at ${recordsPerSecond} records/sec`);
    console.log(`⏱️  Entity breakdown:`, metrics.entityTimes);

    return NextResponse.json({ 
      status: 200, 
      message: "Sync completed successfully",
      metrics: {
        totalTime,
        totalRecords: metrics.totalRecords,
        recordsPerSecond,
        entityTimes: metrics.entityTimes,
        errors: metrics.errors
      }
    });

  } catch (error) {
    console.error("❌ Critical sync error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const isConnectionError = errorMessage.includes("connection") || errorMessage.includes("connect") || errorMessage.includes("timeout");
    
    return NextResponse.json({ 
      status: 500, 
      message: "Sync failed", 
      error: errorMessage,
      isConnectionError,
      timestamp: new Date().toISOString(),
      metrics
    }, { status: 500 });
  }
}

// Optimized downstream sync (online -> offline)
async function syncDownstreamData(metrics: SyncMetrics): Promise<void> {
  console.log("⬇️  Starting downstream sync (online -> offline)...");

  // Warehouses (reference data - sync first)
  const warehouseStart = Date.now();
  const warehouses = await onlinePrisma.warehouses_online.findMany();
  await batchUpsert(
    warehouses,
    offlinePrisma.warehouses,
    'warehouseCode' as keyof typeof warehouses[0],
    (data) => data,
    'warehouses'
  );
  metrics.entityTimes.warehouses = Date.now() - warehouseStart;
  metrics.totalRecords += warehouses.length;

  // Users (reference data)
  const userStart = Date.now();
  const users = await onlinePrisma.users_online.findMany();
  await batchUpsert(
    users,
    offlinePrisma.users,
    'userName' as keyof typeof users[0],
    (data) => {
      const { warehouses_onlineId: warehousesId, ...rest } = data;
      return { ...rest, warehousesId };
    },
    'users'
  );
  metrics.entityTimes.users = Date.now() - userStart;
  metrics.totalRecords += users.length;
}

// Optimized upstream sync (offline -> online)
async function syncUpstreamData(metrics: SyncMetrics): Promise<void> {
  console.log("⬆️  Starting upstream sync (offline -> online)...");

  // Get all unsynced records in parallel for better performance
  const [products, customers, suppliers, sales, purchases, saleItems, purchaseItems, paymentMethods, balancePayments] = await Promise.all([
    offlinePrisma.product.findMany({ where: { sync: false } }),
    offlinePrisma.customer.findMany({ where: { sync: false } }),
    offlinePrisma.supplier.findMany({ where: { sync: false } }),
    offlinePrisma.sale.findMany({ where: { sync: false } }),
    offlinePrisma.purchase.findMany({ where: { sync: false } }),
    offlinePrisma.saleItem.findMany({ where: { sync: false } }),
    offlinePrisma.purchaseItem.findMany({ where: { sync: false } }),
    offlinePrisma.paymentMethod.findMany({ where: { sync: false } }),
    offlinePrisma.balancePayment.findMany({ where: { sync: false } })
  ]);

  // Sync entities in dependency order with higher concurrency
  const concurrency = 15; // Increased for better performance

  // Products (no dependencies)
  if (products.length > 0) {
    const productStart = Date.now();
    await batchUpsert(
      products,
      onlinePrisma.product_online,
      'id' as keyof typeof products[0],
      (data) => {
        const { warehousesId: warehouses_onlineId, ...rest } = data;
        return { ...rest, warehouses_onlineId, sync: true };
      },
      'products',
      concurrency
    );
    metrics.entityTimes.products = Date.now() - productStart;
    metrics.totalRecords += products.length;
  }

  // Customers (no dependencies)
  if (customers.length > 0) {
    const customerStart = Date.now();
    await batchUpsert(
      customers,
      onlinePrisma.customer_online,
      'id' as keyof typeof customers[0],
      (data) => {
        const { warehousesId: warehouses_onlineId, ...rest } = data;
        return { ...rest, warehouses_onlineId, sync: true };
      },
      'customers',
      concurrency
    );
    metrics.entityTimes.customers = Date.now() - customerStart;
    metrics.totalRecords += customers.length;
  }

  // Suppliers (no dependencies)
  if (suppliers.length > 0) {
    const supplierStart = Date.now();
    await batchUpsert(
      suppliers,
      onlinePrisma.supplier_online,
      'id' as keyof typeof suppliers[0],
      (data) => {
        const { warehousesId: warehouses_onlineId, ...rest } = data;
        return { ...rest, warehouses_onlineId, sync: true };
      },
      'suppliers',
      concurrency
    );
    metrics.entityTimes.suppliers = Date.now() - supplierStart;
    metrics.totalRecords += suppliers.length;
  }

  // Sales (depends on customers)
  if (sales.length > 0) {
    const saleStart = Date.now();
    await batchUpsert(
      sales,
      onlinePrisma.sale_online,
      'invoiceNo' as keyof typeof sales[0],
      (data) => {
        const { warehousesId: warehouses_onlineId, selectedCustomerId: customer_onlineId, ...rest } = data;
        return { ...rest, warehouses_onlineId, customer_onlineId, sync: true };
      },
      'sales',
      concurrency
    );
    metrics.entityTimes.sales = Date.now() - saleStart;
    metrics.totalRecords += sales.length;
  }

  // Purchases (depends on suppliers)
  if (purchases.length > 0) {
    const purchaseStart = Date.now();
    await batchUpsert(
      purchases,
      onlinePrisma.purchase_online,
      'referenceNo' as keyof typeof purchases[0],
      (data) => {
        const { warehousesId: warehouses_onlineId, supplierId: supplier_onlineId, ...rest } = data;
        return { ...rest, warehouses_onlineId, supplier_onlineId, sync: true };
      },
      'purchases',
      concurrency
    );
    metrics.entityTimes.purchases = Date.now() - purchaseStart;
    metrics.totalRecords += purchases.length;
  }

  // Sale Items (depends on sales and products)
  if (saleItems.length > 0) {
    const saleItemStart = Date.now();
    await batchUpsert(
      saleItems,
      onlinePrisma.saleItem_online,
      'id' as keyof typeof saleItems[0],
      (data) => {
        const { warehousesId: warehouses_onlineId, saleId: sale_onlineId, customerId: customer_onlineId, productId: product_onlineId, ...rest } = data;
        return { ...rest, warehouses_onlineId, sale_onlineId, product_onlineId, customer_onlineId, sync: true };
      },
      'sale items',
      concurrency
    );
    metrics.entityTimes.saleItems = Date.now() - saleItemStart;
    metrics.totalRecords += saleItems.length;
  }

  // Purchase Items (depends on purchases and products)
  if (purchaseItems.length > 0) {
    const purchaseItemStart = Date.now();
    await batchUpsert(
      purchaseItems,
      onlinePrisma.purchaseItem_online,
      'id' as keyof typeof purchaseItems[0],
      (data) => {
        const { warehousesId: warehouses_onlineId, purchaseId: purchase_onlineId, productId: product_onlineId, ...rest } = data;
        return { ...rest, warehouses_onlineId, product_onlineId, purchase_onlineId, sync: true };
      },
      'purchase items',
      concurrency
    );
    metrics.entityTimes.purchaseItems = Date.now() - purchaseItemStart;
    metrics.totalRecords += purchaseItems.length;
  }

  // Payment Methods (depends on sales)
  if (paymentMethods.length > 0) {
    const paymentStart = Date.now();
    await batchUpsert(
      paymentMethods,
      onlinePrisma.paymentMethod_online,
      'id' as keyof typeof paymentMethods[0],
      (data) => {
        const { warehousesId: warehouses_onlineId, saleId: sale_onlineId, ...rest } = data;
        return { ...rest, warehouses_onlineId, sale_onlineId, sync: true };
      },
      'payment methods',
      concurrency
    );
    metrics.entityTimes.paymentMethods = Date.now() - paymentStart;
    metrics.totalRecords += paymentMethods.length;
  }

  // Balance Payments
  if (balancePayments.length > 0) {
    const balanceStart = Date.now();
    await batchUpsert(
      balancePayments,
      onlinePrisma.balancePayment_online,
      'id' as keyof typeof balancePayments[0],
      (data) => ({ ...data, sync: true }),
      'balance payments',
      concurrency
    );
    metrics.entityTimes.balancePayments = Date.now() - balanceStart;
    metrics.totalRecords += balancePayments.length;
  }

  // Batch update all synced records in offline DB - single operation per entity type
  const updateStart = Date.now();
  await Promise.all([
    products.length > 0 && offlinePrisma.product.updateMany({
      where: { id: { in: products.map(p => p.id) } },
      data: { sync: true, syncedAt: new Date() }
    }),
    customers.length > 0 && offlinePrisma.customer.updateMany({
      where: { id: { in: customers.map(c => c.id) } },
      data: { sync: true, syncedAt: new Date() }
    }),
    suppliers.length > 0 && offlinePrisma.supplier.updateMany({
      where: { id: { in: suppliers.map(s => s.id) } },
      data: { sync: true, syncedAt: new Date() }
    }),
    sales.length > 0 && offlinePrisma.sale.updateMany({
      where: { id: { in: sales.map(s => s.id) } },
      data: { sync: true, syncedAt: new Date() }
    }),
    purchases.length > 0 && offlinePrisma.purchase.updateMany({
      where: { id: { in: purchases.map(p => p.id) } },
      data: { sync: true, syncedAt: new Date() }
    }),
    saleItems.length > 0 && offlinePrisma.saleItem.updateMany({
      where: { id: { in: saleItems.map(si => si.id) } },
      data: { sync: true, syncedAt: new Date() }
    }),
    purchaseItems.length > 0 && offlinePrisma.purchaseItem.updateMany({
      where: { id: { in: purchaseItems.map(pi => pi.id) } },
      data: { sync: true, syncedAt: new Date() }
    }),
    paymentMethods.length > 0 && offlinePrisma.paymentMethod.updateMany({
      where: { id: { in: paymentMethods.map(pm => pm.id) } },
      data: { sync: true, syncedAt: new Date() }
    }),
    balancePayments.length > 0 && offlinePrisma.balancePayment.updateMany({
      where: { id: { in: balancePayments.map(bp => bp.id) } },
      data: { sync: true, syncedAt: new Date() }
    })
  ].filter(Boolean));
  
  metrics.entityTimes.statusUpdates = Date.now() - updateStart;
  console.log(`✅ Updated sync status for all entities in ${metrics.entityTimes.statusUpdates}ms`);
}