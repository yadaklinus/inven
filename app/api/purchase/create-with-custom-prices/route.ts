import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

interface PurchaseItem {
    productId: string;
    productName: string;
    productBarcode: string;
    cost: number;
    customRetailPrice?: number;
    customWholesalePrice?: number;
    selectedPrice: number;
    priceType: "wholesale" | "retail";
    quantity: number;
    discount: number;
    total: number;
}

export async function POST(req: NextRequest) {
    try {
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

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Items array is required and cannot be empty" }, 
                { status: 400 }
            )
        }

        if (!warehouseId || !supplierId) {
            return NextResponse.json(
                { error: "Warehouse ID and Supplier ID are required" }, 
                { status: 400 }
            )
        }

        // Verify warehouse exists
        const warehouse = await prisma.warehouses.findUnique({
            where: { warehouseCode: warehouseId }
        })
            
        if (!warehouse) {
            return NextResponse.json(
                { error: "Warehouse does not exist" }, 
                { status: 404 }
            )
        }

        // Verify supplier exists
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId }
        })

        if (!supplier) {
            return NextResponse.json(
                { error: "Supplier does not exist" }, 
                { status: 404 }
            )
        }

        // Create the purchase order
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
                supplierId,
                status: status || "ordered"
            }
        })

        // Process each purchase item
        for (const item of items as PurchaseItem[]) {
            // Get the current product to validate it exists
            const product = await prisma.product.findFirst({
                where: {
                    OR: [
                        { id: item.productId },
                        { barcode: item.productBarcode }
                    ],
                    warehousesId: warehouseId
                }
            })

            if (!product) {
                // Rollback the purchase if product doesn't exist
                await prisma.purchase.delete({ where: { id: purchase.id } })
                return NextResponse.json(
                    { error: `Product with ID/barcode ${item.productId || item.productBarcode} not found` }, 
                    { status: 404 }
                )
            }

            // Create purchase item with custom prices if provided
            await prisma.purchaseItem.create({
                data: {
                    purchaseId: purchase.referenceNo,
                    productName: item.productName,
                    productId: item.productBarcode,
                    cost: item.cost,
                    selectedPrice: item.selectedPrice,
                    priceType: item.priceType,
                    quantity: item.quantity,
                    discount: item.discount,
                    total: item.total,
                    warehousesId: warehouseId,
                    profit: 0, // For purchases, profit is 0
                    // Store custom prices if provided
                    customRetailPrice: item.customRetailPrice,
                    customWholesalePrice: item.customWholesalePrice
                }
            })

            // Update product quantity (increase stock for purchases)
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    quantity: {
                        increment: item.quantity
                    },
                    // Optionally update product prices if custom prices are provided
                    ...(item.customRetailPrice && { retailPrice: item.customRetailPrice }),
                    ...(item.customWholesalePrice && { wholeSalePrice: item.customWholesalePrice })
                }
            })
        }

        return NextResponse.json({ 
            message: "Purchase order created successfully with custom prices",
            purchase: purchase
        })

    } catch (error) {
        console.error("Error creating purchase with custom prices:", error)
        return NextResponse.json(
            { error: "Internal server error" }, 
            { status: 500 }
        )
    }
}