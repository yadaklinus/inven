import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const warehouseId = searchParams.get('warehouseId');
        
        const whereClause: any = { isDeleted: false };
        
        if (warehouseId) {
            whereClause.warehousesId = warehouseId;
        }
        
        const students = await offlinePrisma.student.findMany({
            where: whereClause,
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