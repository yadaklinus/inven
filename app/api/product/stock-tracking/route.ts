import { NextRequest, NextResponse } from "next/server";

import offlinePrisma from "@/lib/oflinePrisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const productId = searchParams.get('productId')
        const warehouseId = searchParams.get('warehouseId')

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
        }

        // Get product details
        const product = await offlinePrisma.product.findUnique({
            where: { id: productId,isDeleted:false },
            include: {
                warehouses: true
            }
        })

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        // Get all sales for this product
        const consultationItems = await offlinePrisma.consultationItem.findMany({
            where: { 
                productId,
                isDeleted:false,
                ...(warehouseId && { warehousesId: warehouseId })
            },
            include: {
                consultation: {
                    include: {
                        selectedStudent: true
                    }
                }
            },
            orderBy: {
                consultation: {
                    createdAt: 'desc'
                }
            }
        })

        // Get all purchases for this product
        const purchaseItems = await offlinePrisma.purchaseItem.findMany({
            where: { 
                productId,
                isDeleted:false,
                ...(warehouseId && { warehousesId: warehouseId })
            },
            include: {
                Purchase: {
                    include: {
                        Supplier: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Combine and format stock movements
        const stockMovements = []

        // Add sales (stock decrements)
        for (const consultationItem of consultationItems) {
            stockMovements.push({
                id: consultationItem.id,
                type: 'SALE',
                date: consultationItem.consultation?.createdAt || new Date(),
                quantity: -consultationItem.quantity, // Negative for sales
                reference: consultationItem.consultation?.invoiceNo || 'N/A',
                customer: consultationItem.consultation?.selectedStudent?.name || 'N/A',
                supplier: null,
                unitPrice: consultationItem.selectedPrice,
                total: consultationItem.total,
                notes: `Sale to ${consultationItem.consultation?.selectedStudent?.name || 'Customer'}`
            })
        }

        // Add purchases (stock increments)
        for (const purchaseItem of purchaseItems) {
            stockMovements.push({
                id: purchaseItem.id,
                type: 'PURCHASE',
                date: purchaseItem.Purchase?.createdAt || new Date(),
                quantity: purchaseItem.quantity, // Positive for purchases
                reference: purchaseItem.Purchase?.referenceNo || 'N/A',
                customer: null,
                supplier: purchaseItem.Purchase?.Supplier?.name || 'N/A',
                unitPrice: purchaseItem.cost,
                total: purchaseItem.total,
                notes: `Purchase from ${purchaseItem.Purchase?.Supplier?.name || 'Supplier'}`
            })
        }

        // Sort by date (newest first)
        stockMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Calculate running stock balance
        let runningBalance = product.quantity
        const movementsWithBalance = stockMovements.map((movement, i) => {
            const movementWithBalance = { ...movement, balanceAfter: runningBalance }
            runningBalance -= movement.quantity
            return movementWithBalance
        })

        return NextResponse.json({
            product: {
                id: product.id,
                name: product.name,
                barcode: product.barcode,
                currentStock: product.quantity,
                unit: product.unit,
                warehouse: product.warehouses?.name || 'N/A'
            },
            movements: movementsWithBalance,
            summary: {
                totalSales: consultationItems.reduce((sum, item) => sum + item.quantity, 0),
                totalPurchases: purchaseItems.reduce((sum, item) => sum + item.quantity, 0),
                totalMovements: stockMovements.length
            }
        })

    } catch (error) {
        console.error("Error fetching stock tracking data:", error)
        return NextResponse.json({ error: "Failed to fetch stock tracking data" }, { status: 500 })
    }
}