import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(
    req: NextRequest,
    { params }: { params: { productId: string } }
) {
    try {
        const { searchParams } = new URL(req.url)
        const warehouseId = searchParams.get('warehouseId')

        if (!warehouseId) {
            return NextResponse.json(
                { error: "Warehouse ID is required" }, 
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

        // Find the product
        const product = await prisma.product.findFirst({
            where: {
                OR: [
                    { id: params.productId },
                    { barcode: params.productId }
                ],
                warehousesId: warehouseId
            }
        })

        if (!product) {
            return NextResponse.json(
                { error: "Product not found in this warehouse" }, 
                { status: 404 }
            )
        }

        return NextResponse.json({
            productId: product.id,
            name: product.name,
            barcode: product.barcode,
            prices: {
                cost: product.cost,
                retail: product.retailPrice,
                wholesale: product.wholeSalePrice
            },
            quantity: product.quantity,
            unit: product.unit
        })

    } catch (error) {
        console.error("Error fetching product prices:", error)
        return NextResponse.json(
            { error: "Internal server error" }, 
            { status: 500 }
        )
    }
}