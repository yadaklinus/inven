import offlinePrisma from "@/lib/oflinePrisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";


export async function POST(req:NextRequest){
    const {warehouseId} = await req.json()
    try {
        const users = await offlinePrisma.users.findMany({where:{warehousesId:warehouseId,isDeleted:false}})
        return NextResponse.json(users,{status:200})
    } catch (error) {
        return NextResponse.json(error,{status:500})
    }
}