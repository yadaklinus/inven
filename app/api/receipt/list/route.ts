import { PrismaClient } from "@/prisma/generated/offline";
import { NextRequest, NextResponse } from "next/server";


const prisma = new PrismaClient()
export async function POST(req:NextRequest){

    const {
        warehousesId
    } = await req.json()

    try {

        const data = await prisma.receiptSettings.findMany({
            where:{warehousesId,isDeleted:false}
        })
        
        return NextResponse.json(warehousesId,{status:200})
        
    } catch (error) {
        return NextResponse.json(error,{status:500})
    }
}