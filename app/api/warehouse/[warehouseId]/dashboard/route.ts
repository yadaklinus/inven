import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  context: { params: Promise<{ warehouseId: string }> }
) {
  try {
    const { warehouseId } = await context.params;

    // Get warehouse info first
    const warehouse = await prisma.warehouses.findUnique({
      where: { warehouseCode: warehouseId }
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Fetch warehouse-specific statistics
    const [
      totalUsers,
      totalProducts,
      totalSales,
      totalCustomers,
      totalSuppliers,
      recentSales,
      lowStockProducts,
      topProducts,
      salesByMonth
    ] = await Promise.all([
      // Total users in this warehouse
      prisma.users.count({
        where: { warehousesId: warehouseId }
      }),
      
      // Total products in this warehouse
      prisma.product.count({
        where: { warehousesId: warehouseId }
      }),
      
      // Total sales for this warehouse
      prisma.sale.count({
        where: { warehousesId: warehouseId }
      }),
      
      // Total customers for this warehouse
      prisma.customer.count({
        where: { warehousesId: warehouseId }
      }),
      
      // Total suppliers for this warehouse
      prisma.supplier.count({
        where: { warehousesId: warehouseId }
      }),
      
      // Recent sales for this warehouse
      prisma.sale.findMany({
        where: { warehousesId: warehouseId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          selectedCustomer: true,
          paymentMethod: true,
          saleItems: {
            include: {
              product: true
            }
          }
        }
      }),
      
      // Low stock products (quantity <= 5)
      prisma.product.findMany({
        where: { 
          warehousesId: warehouseId,
          quantity: { lte: 5 }
        },
        take: 10,
        orderBy: { quantity: 'asc' }
      }),
      
      // Top selling products by quantity
      prisma.saleItem.groupBy({
        by: ['productId', 'productName'],
        where: { warehousesId: warehouseId },
        _sum: {
          quantity: true,
          total: true
        },
        orderBy: {
          _sum: {
            total: 'desc'
          }
        },
        take: 5
      }),
      
      // Sales by month for the last 6 months
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
          COUNT(*)::int as sales,
          SUM("grandTotal")::float as revenue
        FROM "Sale" 
        WHERE "warehousesId" = ${warehouseId} 
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt")
      `
    ]);

    // Calculate total revenue for this warehouse
    const totalRevenue = await prisma.sale.aggregate({
      where: { warehousesId: warehouseId },
      _sum: {
        grandTotal: true
      }
    });

    // Get user roles distribution for this warehouse
    const userRoles = await prisma.users.groupBy({
      by: ['role'],
      where: { warehousesId: warehouseId },
      _count: {
        role: true
      }
    });

    // Get customer types distribution for this warehouse
    const customerTypes = await prisma.customer.groupBy({
      by: ['type'],
      where: { warehousesId: warehouseId },
      _count: {
        type: true
      }
    });

    // Calculate average sale value
    const avgSaleValue = totalSales > 0 ? (totalRevenue._sum.grandTotal || 0) / totalSales : 0;

    return NextResponse.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.warehouseCode,
        address: warehouse.address,
        email: warehouse.email,
        phone: warehouse.phoneNumber
      },
      metrics: {
        totalUsers,
        totalProducts,
        totalSales,
        totalCustomers,
        totalSuppliers,
        totalRevenue: totalRevenue._sum.grandTotal || 0,
        avgSaleValue
      },
      recentSales: recentSales.map((sale: any) => ({
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        customerName: sale.selectedCustomer?.name || 'Walk-in Customer',
        grandTotal: sale.grandTotal,
        createdAt: sale.createdAt,
        paymentMethod: sale.paymentMethod?.[0]?.method || 'cash',
        itemsCount: sale.saleItems.length
      })),
      lowStockProducts: lowStockProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        quantity: product.quantity,
        unit: product.unit
      })),
      topProducts: topProducts.map((product: any) => ({
        productId: product.productId,
        name: product.productName,
        sales: product._sum.quantity,
        revenue: product._sum.total
      })),
      salesByMonth: salesByMonth || [],
      userRoles: userRoles.map((role: any) => ({
        name: role.role,
        value: role._count.role,
        color: role.role === 'admin' ? '#10b981' : role.role === 'sales' ? '#3b82f6' : '#f59e0b'
      })),
      customerTypes: customerTypes.map((type: any) => ({
        name: type.type,
        value: type._count.type,
        color: type.type === 'retal' ? '#3b82f6' : '#10b981'
      }))
    });
  } catch (error) {
    console.error('Failed to fetch warehouse dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse dashboard statistics' },
      { status: 500 }
    );
  }
}