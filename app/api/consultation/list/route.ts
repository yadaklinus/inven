import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";

export async function GET(req: NextRequest) {
    try {
        const {
            warehouseId
        } = await req.json()
        
        const consultations = await offlinePrisma.consultation.findMany({
            where: {
                warehousesId:warehouseId
            },
            include: {
                selectedStudent: {
                    select: {
                        id: true,
                        name: true,
                        matricNumber: true,
                        phone: true,
                        email: true,
                        bloodGroup: true,
                        genotype: true,
                        allergies: true
                    }
                },
                consultationItems: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                barcode: true
                            }
                        }
                    }
                },
                paymentMethod: true
            },
            orderBy: { createdAt: 'desc' }
        });
        
        return NextResponse.json(consultations, { status: 200 });
    } catch (error) {
        console.error("Consultation list fetch error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}