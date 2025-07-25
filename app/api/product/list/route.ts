import { PrismaClient } from "@/prisma/generated/offline";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()


export async function POST(req:NextRequest){
    const {warehouseId:warehousesId} = await req.json()
    
    try {
        const products = await prisma.product.findMany({where:{warehousesId,isDeleted:false}})

        return NextResponse.json(products,{status:200})
    } catch (error) {
        return NextResponse.json(error,{status:500})
        
    }finally{
        await prisma.$disconnect()
    }
}

