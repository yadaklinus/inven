import { PrismaClient } from "@/prisma/generated/offline";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function POST(req:NextRequest) {
  try {
    const { warehouseId } = await req.json()

    //console.log(warehouseId)

    // Get warehouse info first
    const warehouse = await prisma.warehouses.findUnique({
      where: { warehouseCode: warehouseId,isDeleted:false }
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Fetch clinic-specific statistics
    const [
      totalUsers,
      totalProducts,
      totalConsultations,
      totalStudents,
      totalSuppliers,
      recentConsultations,
      lowStockProducts,
      topMedicines,
      consultationsByMonth
    ] = [
      // Total users in this clinic
      await prisma.users.count({
        where: { warehousesId: warehouseId,isDeleted:false }
      }),
      
      // Total medicines/products in this clinic
      await prisma.product.count({
        where: { warehousesId: warehouseId,isDeleted:false }
      }),
      
      // Total consultations for this clinic
      await prisma.consultation.count({
        where: { warehousesId: warehouseId,isDeleted:false }
      }),
      
      // Total students registered in this clinic
      await prisma.student.count({
        where: { warehousesId: warehouseId,isDeleted:false }
      }),
      
      // Total suppliers for this clinic
      await prisma.supplier.count({
        where: { warehousesId: warehouseId,isDeleted:false }
      }),
      
      // Recent consultations for this clinic
      await prisma.consultation.findMany({
        where: { warehousesId: warehouseId,isDeleted:false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          selectedStudent: true,
          paymentMethod: true,
          consultationItems: {
            include: {
              product: true
            }
          }
        }
      }),
      
      // Low stock medicines (quantity <= 5)
      await prisma.product.findMany({
        where: { 
          warehousesId: warehouseId,
          isDeleted:false,
          quantity: { lte: 5 }
        },
        take: 10,
        orderBy: { quantity: 'asc' }
      }),
      
      // Top prescribed medicines by quantity
      await prisma.consultationItem.groupBy({
        by: ['productId', 'productName'],
        where: { warehousesId: warehouseId,isDeleted:false },
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
      
      // Consultations by month for the last 6 months
      await prisma.$queryRawUnsafe(`
        SELECT 
          strftime('%Y-%m', "createdAt") AS month,
          COUNT(*) AS consultations,
          SUM("grandTotal") AS revenue
        FROM "Consultation"
        WHERE "warehousesId" = ?
          AND "createdAt" >= datetime('now', '-6 months')
        GROUP BY strftime('%Y-%m', "createdAt")
        ORDER BY strftime('%Y-%m', "createdAt")
      `, warehouseId)


    ];

    // Calculate total revenue for this clinic
    const totalRevenue = await prisma.consultation.aggregate({
      where: { warehousesId: warehouseId,isDeleted:false },
      _sum: {
        grandTotal: true
      }
    });

    // Get user roles distribution for this clinic
    const userRoles = await prisma.users.groupBy({
      by: ['role'],
      where: { warehousesId: warehouseId,isDeleted:false },
      _count: {
        role: true
      }
    });

    // Get student departments distribution for this clinic
    const studentDepartments = await prisma.student.groupBy({
      by: ['department'],
      where: { warehousesId: warehouseId,isDeleted:false, department: { not: null } },
      _count: {
        department: true
      }
    });

    // Calculate average consultation value
    const avgConsultationValue = totalConsultations > 0 ? (totalRevenue._sum.grandTotal || 0) / totalConsultations : 0;

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
        totalConsultations,
        totalStudents,
        totalSuppliers,
        totalRevenue: totalRevenue._sum.grandTotal || 0,
        avgConsultationValue
      },
      recentConsultations: recentConsultations.map((consultation: any) => ({
        id: consultation.id,
        invoiceNo: consultation.invoiceNo,
        studentName: consultation.selectedStudent?.name || 'Walk-in Student',
        studentMatric: consultation.selectedStudent?.matricNumber || 'N/A',
        diagnosis: consultation.diagnosis || 'General consultation',
        grandTotal: consultation.grandTotal,
        createdAt: consultation.createdAt,
        paymentMethod: consultation.paymentMethod?.[0]?.method || 'cash',
        itemsCount: consultation.consultationItems.length
      })),
      lowStockProducts: lowStockProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        quantity: product.quantity,
        unit: product.unit
      })),
      topMedicines: topMedicines.map((medicine: any) => ({
        productId: medicine.productId,
        name: medicine.productName,
        prescriptions: medicine._sum.quantity,
        revenue: medicine._sum.total
      })),
      consultationsByMonth: consultationsByMonth || [],
      userRoles: userRoles.map((role: any) => ({
        name: role.role,
        value: role._count.role,
        color: role.role === 'admin' ? '#10b981' : role.role === 'sales' ? '#3b82f6' : '#f59e0b'
      })),
      studentDepartments: studentDepartments.map((dept: any) => ({
        name: dept.department || 'Unknown',
        value: dept._count.department,
        color: '#3b82f6'
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