const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PrismaClient: PrismaClientOnline } = require('@prisma/client/generated/online');

const router = express.Router();
const prisma = new PrismaClient();
const prismaOnline = new PrismaClientOnline();

// Sync data from SQLite to PostgreSQL
router.post('/to-online', async (req, res) => {
  try {
    const { table, warehouseId } = req.body;

    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    let result = { synced: 0, errors: [] };

    switch (table) {
      case 'products':
        result = await syncProducts(warehouseId);
        break;
      case 'customers':
        result = await syncCustomers(warehouseId);
        break;
      case 'suppliers':
        result = await syncSuppliers(warehouseId);
        break;
      case 'sales':
        result = await syncSales(warehouseId);
        break;
      case 'purchases':
        result = await syncPurchases(warehouseId);
        break;
      case 'users':
        result = await syncUsers(warehouseId);
        break;
      case 'warehouses':
        result = await syncWarehouses();
        break;
      case 'all':
        result = await syncAll(warehouseId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid table name' });
    }

    res.json(result);

  } catch (error) {
    console.error('Sync to online error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync data from PostgreSQL to SQLite
router.post('/to-offline', async (req, res) => {
  try {
    const { table, warehouseId } = req.body;

    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    let result = { synced: 0, errors: [] };

    switch (table) {
      case 'products':
        result = await syncProductsFromOnline(warehouseId);
        break;
      case 'customers':
        result = await syncCustomersFromOnline(warehouseId);
        break;
      case 'suppliers':
        result = await syncSuppliersFromOnline(warehouseId);
        break;
      case 'sales':
        result = await syncSalesFromOnline(warehouseId);
        break;
      case 'purchases':
        result = await syncPurchasesFromOnline(warehouseId);
        break;
      case 'users':
        result = await syncUsersFromOnline(warehouseId);
        break;
      case 'warehouses':
        result = await syncWarehousesFromOnline();
        break;
      case 'all':
        result = await syncAllFromOnline(warehouseId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid table name' });
    }

    res.json(result);

  } catch (error) {
    console.error('Sync to offline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sync status
router.get('/status', async (req, res) => {
  try {
    const { warehouseId } = req.query;

    const where = warehouseId ? { warehousesId: warehouseId } : {};

    const [
      productsCount,
      customersCount,
      suppliersCount,
      salesCount,
      purchasesCount,
      usersCount,
      warehousesCount
    ] = await Promise.all([
      prisma.product.count({ where: { ...where, sync: false } }),
      prisma.customer.count({ where: { ...where, sync: false } }),
      prisma.supplier.count({ where: { ...where, sync: false } }),
      prisma.sale.count({ where: { ...where, sync: false } }),
      prisma.purchase.count({ where: { ...where, sync: false } }),
      prisma.users.count({ where: { ...where, sync: false } }),
      prisma.warehouses.count({ where: { sync: false } })
    ]);

    res.json({
      pendingSync: {
        products: productsCount,
        customers: customersCount,
        suppliers: suppliersCount,
        sales: salesCount,
        purchases: purchasesCount,
        users: usersCount,
        warehouses: warehousesCount
      }
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions for syncing
async function syncProducts(warehouseId) {
  const where = warehouseId ? { warehousesId, sync: false } : { sync: false };
  const products = await prisma.product.findMany({ where });
  let synced = 0;
  const errors = [];

  for (const product of products) {
    try {
      await prismaOnline.product_online.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          barcode: product.barcode,
          wholeSalePrice: product.wholeSalePrice,
          retailPrice: product.retailPrice,
          cost: product.cost,
          quantity: product.quantity,
          taxRate: product.taxRate,
          unit: product.unit,
          description: product.description,
          warehouses_onlineId: product.warehousesId,
          sync: true,
          syncedAt: new Date()
        },
        create: {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          wholeSalePrice: product.wholeSalePrice,
          retailPrice: product.retailPrice,
          cost: product.cost,
          quantity: product.quantity,
          taxRate: product.taxRate,
          unit: product.unit,
          description: product.description,
          warehouses_onlineId: product.warehousesId,
          sync: true,
          syncedAt: new Date()
        }
      });

      await prisma.product.update({
        where: { id: product.id },
        data: { sync: true, syncedAt: new Date() }
      });

      synced++;
    } catch (error) {
      errors.push({ id: product.id, error: error.message });
    }
  }

  return { synced, errors };
}

async function syncCustomers(warehouseId) {
  const where = warehouseId ? { warehousesId, sync: false } : { sync: false };
  const customers = await prisma.customer.findMany({ where });
  let synced = 0;
  const errors = [];

  for (const customer of customers) {
    try {
      await prismaOnline.customer_online.upsert({
        where: { id: customer.id },
        update: {
          name: customer.name,
          type: customer.type,
          companyName: customer.companyName,
          email: customer.email,
          address: customer.address,
          phone: customer.phone,
          warehouses_onlineId: customer.warehousesId,
          sync: true,
          syncedAt: new Date()
        },
        create: {
          id: customer.id,
          name: customer.name,
          type: customer.type,
          companyName: customer.companyName,
          email: customer.email,
          address: customer.address,
          phone: customer.phone,
          warehouses_onlineId: customer.warehousesId,
          sync: true,
          syncedAt: new Date()
        }
      });

      await prisma.customer.update({
        where: { id: customer.id },
        data: { sync: true, syncedAt: new Date() }
      });

      synced++;
    } catch (error) {
      errors.push({ id: customer.id, error: error.message });
    }
  }

  return { synced, errors };
}

async function syncSuppliers(warehouseId) {
  const where = warehouseId ? { warehousesId, sync: false } : { sync: false };
  const suppliers = await prisma.supplier.findMany({ where });
  let synced = 0;
  const errors = [];

  for (const supplier of suppliers) {
    try {
      await prismaOnline.supplier_online.upsert({
        where: { id: supplier.id },
        update: {
          name: supplier.name,
          type: supplier.type,
          companyName: supplier.companyName,
          email: supplier.email,
          address: supplier.address,
          phone: supplier.phone,
          warehouses_onlineId: supplier.warehousesId,
          sync: true,
          syncedAt: new Date()
        },
        create: {
          id: supplier.id,
          name: supplier.name,
          type: supplier.type,
          companyName: supplier.companyName,
          email: supplier.email,
          address: supplier.address,
          phone: supplier.phone,
          warehouses_onlineId: supplier.warehousesId,
          sync: true,
          syncedAt: new Date()
        }
      });

      await prisma.supplier.update({
        where: { id: supplier.id },
        data: { sync: true, syncedAt: new Date() }
      });

      synced++;
    } catch (error) {
      errors.push({ id: supplier.id, error: error.message });
    }
  }

  return { synced, errors };
}

async function syncSales(warehouseId) {
  const where = warehouseId ? { warehousesId, sync: false } : { sync: false };
  const sales = await prisma.sale.findMany({ 
    where,
    include: { saleItems: true, paymentMethod: true }
  });
  let synced = 0;
  const errors = [];

  for (const sale of sales) {
    try {
      await prismaOnline.sale_online.upsert({
        where: { id: sale.id },
        update: {
          subTotal: sale.subTotal,
          notes: sale.notes,
          amountPaid: sale.amountPaid,
          taxRate: sale.taxRate,
          grandTotal: sale.grandTotal,
          paidAmount: sale.paidAmount,
          balance: sale.balance,
          warehouses_onlineId: sale.warehousesId,
          customer_onlineId: sale.selectedCustomerId,
          sync: true,
          syncedAt: new Date()
        },
        create: {
          id: sale.id,
          invoiceNo: sale.invoiceNo,
          subTotal: sale.subTotal,
          notes: sale.notes,
          amountPaid: sale.amountPaid,
          taxRate: sale.taxRate,
          grandTotal: sale.grandTotal,
          paidAmount: sale.paidAmount,
          balance: sale.balance,
          warehouses_onlineId: sale.warehousesId,
          customer_onlineId: sale.selectedCustomerId,
          sync: true,
          syncedAt: new Date()
        }
      });

      // Sync sale items
      for (const item of sale.saleItems) {
        await prismaOnline.saleItem_online.upsert({
          where: { id: item.id },
          update: {
            productName: item.productName,
            cost: item.cost,
            selectedPrice: item.selectedPrice,
            priceType: item.priceType,
            quantity: item.quantity,
            discount: item.discount,
            total: item.total,
            profit: item.profit,
            warehouses_onlineId: item.warehousesId,
            sale_onlineId: sale.invoiceNo,
            customer_onlineId: item.customerId,
            product_onlineId: item.productId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            id: item.id,
            productName: item.productName,
            cost: item.cost,
            selectedPrice: item.selectedPrice,
            priceType: item.priceType,
            quantity: item.quantity,
            discount: item.discount,
            total: item.total,
            profit: item.profit,
            warehouses_onlineId: item.warehousesId,
            sale_onlineId: sale.invoiceNo,
            customer_onlineId: item.customerId,
            product_onlineId: item.productId,
            sync: true,
            syncedAt: new Date()
          }
        });
      }

      await prisma.sale.update({
        where: { id: sale.id },
        data: { sync: true, syncedAt: new Date() }
      });

      synced++;
    } catch (error) {
      errors.push({ id: sale.id, error: error.message });
    }
  }

  return { synced, errors };
}

async function syncPurchases(warehouseId) {
  const where = warehouseId ? { warehousesId, sync: false } : { sync: false };
  const purchases = await prisma.purchase.findMany({ 
    where,
    include: { purchaseItem: true }
  });
  let synced = 0;
  const errors = [];

  for (const purchase of purchases) {
    try {
      await prismaOnline.purchase_online.upsert({
        where: { id: purchase.id },
        update: {
          taxRate: purchase.taxRate,
          subTotal: purchase.subTotal,
          notes: purchase.notes,
          amountPaid: purchase.amountPaid,
          grandTotal: purchase.grandTotal,
          paidAmount: purchase.paidAmount,
          balance: purchase.balance,
          warehouses_onlineId: purchase.warehousesId,
          supplier_onlineId: purchase.supplierId,
          sync: true,
          syncedAt: new Date()
        },
        create: {
          id: purchase.id,
          referenceNo: purchase.referenceNo,
          taxRate: purchase.taxRate,
          subTotal: purchase.subTotal,
          notes: purchase.notes,
          amountPaid: purchase.amountPaid,
          grandTotal: purchase.grandTotal,
          paidAmount: purchase.paidAmount,
          balance: purchase.balance,
          warehouses_onlineId: purchase.warehousesId,
          supplier_onlineId: purchase.supplierId,
          sync: true,
          syncedAt: new Date()
        }
      });

      // Sync purchase items
      for (const item of purchase.purchaseItem) {
        await prismaOnline.purchaseItem_online.upsert({
          where: { id: item.id },
          update: {
            productId: item.productId,
            cost: item.cost,
            selectedPrice: item.selectedPrice,
            productName: item.productName,
            priceType: item.priceType,
            quantity: item.quantity,
            discount: item.discount,
            total: item.total,
            profit: item.profit,
            customRetailPrice: item.customRetailPrice,
            customWholesalePrice: item.customWholesalePrice,
            warehouses_onlineId: item.warehousesId,
            purchase_onlineId: purchase.referenceNo,
            product_onlineId: item.productId,
            sync: true,
            syncedAt: new Date()
          },
          create: {
            id: item.id,
            productId: item.productId,
            cost: item.cost,
            selectedPrice: item.selectedPrice,
            productName: item.productName,
            priceType: item.priceType,
            quantity: item.quantity,
            discount: item.discount,
            total: item.total,
            profit: item.profit,
            customRetailPrice: item.customRetailPrice,
            customWholesalePrice: item.customWholesalePrice,
            warehouses_onlineId: item.warehousesId,
            purchase_onlineId: purchase.referenceNo,
            product_onlineId: item.productId,
            sync: true,
            syncedAt: new Date()
          }
        });
      }

      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { sync: true, syncedAt: new Date() }
      });

      synced++;
    } catch (error) {
      errors.push({ id: purchase.id, error: error.message });
    }
  }

  return { synced, errors };
}

async function syncUsers(warehouseId) {
  const where = warehouseId ? { warehousesId, sync: false } : { sync: false };
  const users = await prisma.users.findMany({ where });
  let synced = 0;
  const errors = [];

  for (const user of users) {
    try {
      await prismaOnline.users_online.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          userName: user.userName,
          phoneNumber: user.phoneNumber,
          password: user.password,
          role: user.role,
          lastLogin: user.lastLogin,
          warehouses_onlineId: user.warehousesId,
          sync: true,
          syncedAt: new Date()
        },
        create: {
          id: user.id,
          email: user.email,
          userName: user.userName,
          phoneNumber: user.phoneNumber,
          password: user.password,
          role: user.role,
          lastLogin: user.lastLogin,
          warehouses_onlineId: user.warehousesId,
          sync: true,
          syncedAt: new Date()
        }
      });

      await prisma.users.update({
        where: { id: user.id },
        data: { sync: true, syncedAt: new Date() }
      });

      synced++;
    } catch (error) {
      errors.push({ id: user.id, error: error.message });
    }
  }

  return { synced, errors };
}

async function syncWarehouses() {
  const warehouses = await prisma.warehouses.findMany({ where: { sync: false } });
  let synced = 0;
  const errors = [];

  for (const warehouse of warehouses) {
    try {
      await prismaOnline.warehouses_online.upsert({
        where: { id: warehouse.id },
        update: {
          warehouseCode: warehouse.warehouseCode,
          name: warehouse.name,
          phoneNumber: warehouse.phoneNumber,
          email: warehouse.email,
          description: warehouse.description,
          address: warehouse.address,
          sync: true,
          syncedAt: new Date()
        },
        create: {
          id: warehouse.id,
          warehouseCode: warehouse.warehouseCode,
          name: warehouse.name,
          phoneNumber: warehouse.phoneNumber,
          email: warehouse.email,
          description: warehouse.description,
          address: warehouse.address,
          sync: true,
          syncedAt: new Date()
        }
      });

      await prisma.warehouses.update({
        where: { id: warehouse.id },
        data: { sync: true, syncedAt: new Date() }
      });

      synced++;
    } catch (error) {
      errors.push({ id: warehouse.id, error: error.message });
    }
  }

  return { synced, errors };
}

async function syncAll(warehouseId) {
  const results = await Promise.all([
    syncWarehouses(),
    syncUsers(warehouseId),
    syncProducts(warehouseId),
    syncCustomers(warehouseId),
    syncSuppliers(warehouseId),
    syncSales(warehouseId),
    syncPurchases(warehouseId)
  ]);

  const totalSynced = results.reduce((sum, result) => sum + result.synced, 0);
  const allErrors = results.reduce((errors, result) => [...errors, ...result.errors], []);

  return { synced: totalSynced, errors: allErrors };
}

// Similar functions for syncing from online to offline (reverse sync)
async function syncProductsFromOnline(warehouseId) {
  const where = warehouseId ? { warehouses_onlineId: warehouseId, sync: false } : { sync: false };
  const products = await prismaOnline.product_online.findMany({ where });
  let synced = 0;
  const errors = [];

  for (const product of products) {
    try {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          barcode: product.barcode,
          wholeSalePrice: product.wholeSalePrice,
          retailPrice: product.retailPrice,
          cost: product.cost,
          quantity: product.quantity,
          taxRate: product.taxRate,
          unit: product.unit,
          description: product.description,
          warehousesId: product.warehouses_onlineId,
          sync: true,
          syncedAt: new Date()
        },
        create: {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          wholeSalePrice: product.wholeSalePrice,
          retailPrice: product.retailPrice,
          cost: product.cost,
          quantity: product.quantity,
          taxRate: product.taxRate,
          unit: product.unit,
          description: product.description,
          warehousesId: product.warehouses_onlineId,
          sync: true,
          syncedAt: new Date()
        }
      });

      await prismaOnline.product_online.update({
        where: { id: product.id },
        data: { sync: true, syncedAt: new Date() }
      });

      synced++;
    } catch (error) {
      errors.push({ id: product.id, error: error.message });
    }
  }

  return { synced, errors };
}

// Add similar functions for other entities...
async function syncCustomersFromOnline(warehouseId) {
  // Implementation similar to syncCustomers but in reverse
  return { synced: 0, errors: [] };
}

async function syncSuppliersFromOnline(warehouseId) {
  // Implementation similar to syncSuppliers but in reverse
  return { synced: 0, errors: [] };
}

async function syncSalesFromOnline(warehouseId) {
  // Implementation similar to syncSales but in reverse
  return { synced: 0, errors: [] };
}

async function syncPurchasesFromOnline(warehouseId) {
  // Implementation similar to syncPurchases but in reverse
  return { synced: 0, errors: [] };
}

async function syncUsersFromOnline(warehouseId) {
  // Implementation similar to syncUsers but in reverse
  return { synced: 0, errors: [] };
}

async function syncWarehousesFromOnline() {
  // Implementation similar to syncWarehouses but in reverse
  return { synced: 0, errors: [] };
}

async function syncAllFromOnline(warehouseId) {
  const results = await Promise.all([
    syncWarehousesFromOnline(),
    syncUsersFromOnline(warehouseId),
    syncProductsFromOnline(warehouseId),
    syncCustomersFromOnline(warehouseId),
    syncSuppliersFromOnline(warehouseId),
    syncSalesFromOnline(warehouseId),
    syncPurchasesFromOnline(warehouseId)
  ]);

  const totalSynced = results.reduce((sum, result) => sum + result.synced, 0);
  const allErrors = results.reduce((errors, result) => [...errors, ...result.errors], []);

  return { synced: totalSynced, errors: allErrors };
}

module.exports = router;