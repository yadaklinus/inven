import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function PATCH(req: NextRequest) {
    try {
        const {
            productId,
            retailPrice,
            wholesalePrice,
            warehouseId
        } = await req.json()

        // Validate required fields
        if (!productId || !warehouseId) {
            return NextResponse.json(
                { error: "Product ID and Warehouse ID are required" }, 
                { status: 400 }
            )
        }

        // Validate that at least one price is provided
        if (retailPrice === undefined && wholesalePrice === undefined) {
            return NextResponse.json(
                { error: "At least one price (retail or wholesale) must be provided" }, 
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
        const existingProduct = await prisma.product.findFirst({
            where: {
                OR: [
                    { id: productId },
                    { barcode: productId }
                ],
                warehousesId: warehouseId
            }
        })

        if (!existingProduct) {
            return NextResponse.json(
                { error: "Product not found in this warehouse" }, 
                { status: 404 }
            )
        }

        // Prepare update data
        const updateData: any = {}
        if (retailPrice !== undefined) {
            updateData.retailPrice = parseFloat(retailPrice)
        }
        if (wholesalePrice !== undefined) {
            updateData.wholeSalePrice = parseFloat(wholesalePrice)
        }

        // Update the product prices
        const updatedProduct = await prisma.product.update({
            where: { id: existingProduct.id },
            data: updateData
        })

        return NextResponse.json({
            message: "Product prices updated successfully",
            product: {
                id: updatedProduct.id,
                name: updatedProduct.name,
                barcode: updatedProduct.barcode,
                retailPrice: updatedProduct.retailPrice,
                wholesalePrice: updatedProduct.wholeSalePrice,
                cost: updatedProduct.cost
            }
        })

    } catch (error) {
        console.error("Error updating product prices:", error)
        return NextResponse.json(
            { error: "Internal server error" }, 
            { status: 500 }
        )
    }
}