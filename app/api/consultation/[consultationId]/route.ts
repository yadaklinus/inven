import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ consultationId : string }> }
) {
    try {
        const { consultationId } = await context.params
        const consultation = await offlinePrisma.consultation.findUnique({
            where: { 
                invoiceNo: consultationId, 
                isDeleted: false 
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
            }
        });

        if (!consultation) {
            return NextResponse.json("Consultation not found", { status: 404 });
        }

        return NextResponse.json(consultation, { status: 200 });
    } catch (error) {
        console.error("Consultation fetch error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { consultationId: string } }
) {
    try {
        const {
            diagnosis,
            symptoms,
            consultantNotes,
            notes
        } = await req.json();

        const existingConsultation = await offlinePrisma.consultation.findUnique({
            where: { invoiceNo: params.consultationId, isDeleted: false }
        });

        if (!existingConsultation) {
            return NextResponse.json("Consultation not found", { status: 404 });
        }

        const updatedConsultation = await offlinePrisma.consultation.update({
            where: { invoiceNo: params.consultationId },
            data: {
                diagnosis,
                symptoms,
                consultantNotes,
                notes,
                sync: false,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            message: "Consultation updated successfully",
            consultation: updatedConsultation
        }, { status: 200 });
    } catch (error) {
        console.error("Consultation update error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { consultationId: string } }
) {
    try {
        const consultation = await offlinePrisma.consultation.findUnique({
            where: { invoiceNo: params.consultationId }
        });

        if (!consultation) {
            return NextResponse.json("Consultation not found", { status: 404 });
        }

        // Soft delete the consultation
        await offlinePrisma.consultation.update({
            where: { invoiceNo: params.consultationId },
            data: {
                isDeleted: true,
                sync: false,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            message: "Consultation deleted successfully"
        }, { status: 200 });
    } catch (error) {
        console.error("Consultation deletion error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}