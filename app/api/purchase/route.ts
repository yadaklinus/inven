import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
    const {
        items,
        referenceNo,
        subtotal,
        taxRate,
        taxAmount,
        shipping,
        grandTotal,
        paidAmount,
        balance,
        notes,
        warehouseId,
        supplierId,
        status
    } = await req.json()

    try {
        const warehouse = await prisma.warehouses.findUnique({
            where: { warehouseCode: warehouseId }
        })
            
        if (!warehouse) {
            return NextResponse.json("Warehouse does not exist", { status: 401 })
        }

        const purchase = await prisma.purchase.create({
            data: {
                referenceNo,
                subTotal: subtotal,
                taxRate,
                notes,
                amountPaid: paidAmount,
                grandTotal,
                paidAmount,
                balance,
                warehousesId: warehouseId,
                supplierId
            }
        })

        // Create purchase items
        for (let i = 0; i < items.length; i++) {
            await prisma.purchaseItem.create({
                data: {
                    purchaseId: purchase.referenceNo,
                    productName: items[i].productName,
                    productId: items[i].productBarcode,
                    cost: items[i].cost,
                    selectedPrice: items[i].selectedPrice,
                    priceType: items[i].priceType,
                    quantity: items[i].quantity,
                    discount: items[i].discount,
                    total: items[i].total,
                    warehousesId: warehouseId,
                    profit: 0, // For purchases, profit is 0
                }
            })

            // Update product quantity (increase stock for purchases)
            await prisma.product.update({
                where: { barcode: items[i].productBarcode },
                data: {
                    quantity: {
                        increment: items[i].quantity
                    }
                }
            })
        }

        return NextResponse.json({ 
            message: "Purchase order created successfully",
            purchase: purchase
        })
    } catch (error) {
        console.log(error)
        return NextResponse.json(error, { status: 500 })
    }
}