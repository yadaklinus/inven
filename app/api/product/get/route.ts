import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
    const { productId } = await req.json();
    
    try {
        const product = await offlinePrisma.product.findUnique({
            where: {
                id: productId,
                isDeleted: false
            }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}