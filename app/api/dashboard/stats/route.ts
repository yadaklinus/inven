import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch dashboard statistics from the database
    const [
      totalUsers,
      totalWarehouses,
      totalProducts,
      totalSales,
      totalCustomers,
      recentSales
    ] = await Promise.all([
      prisma.users.count(),
      prisma.warehouses.count(),
      prisma.product.count(),
      prisma.sale.count(),
      prisma.customer.count(),
      prisma.sale.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          selectedCustomer: true,
          saleItems: {
            include: {
              product: true
            }
          }
        }
      })
    ])

    // Calculate total sales amount
    const totalSalesAmount = await prisma.sale.aggregate({
      _sum: {
        grandTotal: true
      }
    })

    // Calculate total revenue and profit
    const totalRevenue = totalSalesAmount._sum.grandTotal || 0

    return NextResponse.json({
      totalUsers,
      totalWarehouses,
      totalProducts,
      totalSales,
      totalCustomers,
      totalRevenue,
      recentSales: recentSales.map(sale => ({
        id: sale.invoiceNo,
        customer: sale.selectedCustomer?.name || 'Unknown Customer',
        amount: sale.grandTotal,
        date: sale.createdAt.toISOString(),
        items: sale.saleItems.length,
        products: sale.saleItems.map(item => item.productName).join(', ')
      }))
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}