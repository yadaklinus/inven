import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
    try {
        const {
            warehouseId
        } = await req.json()
        console.log(warehouseId)
        
        const students = await offlinePrisma.student.findMany({
            where: {
                warehousesId:warehouseId
            },
            orderBy: { createdAt: 'desc' }
        });
        
        return NextResponse.json(students, { status: 200 });
    } catch (error) {
        console.error("Student list fetch error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}