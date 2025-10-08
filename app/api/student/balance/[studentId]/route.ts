import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { studentId: string } }
) {
    try {
        const student = await offlinePrisma.student.findUnique({
            where: { id: params.studentId, isDeleted: false }
        });

        if (!student) {
            return NextResponse.json("Student not found", { status: 404 });
        }

        return NextResponse.json({ balance: student.accountBalance }, { status: 200 });
    } catch (error) {
        console.error("Student balance fetch error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { studentId: string } }
) {
    try {
        const { amount, description, saleId, warehouseId } = await req.json();

        const student = await offlinePrisma.student.findUnique({
            where: { id: params.studentId, isDeleted: false }
        });

        if (!student) {
            return NextResponse.json("Student not found", { status: 404 });
        }

        // Update student balance
        const updatedStudent = await offlinePrisma.student.update({
            where: { id: params.studentId },
            data: {
                accountBalance: {
                    decrement: amount
                },
                sync: false,
                syncedAt: null,
                updatedAt: new Date()
            }
        });

        // Create balance transaction record
        await offlinePrisma.balanceTransaction.create({
            data: {
                studentId: params.studentId,
                amount: amount,
                type: "DEBIT",
                description: description || "Consultation payment",
                saleId: saleId,
                balanceAfter: updatedStudent.accountBalance,
                warehouseId: warehouseId,
                sync: false
            }
        });

        return NextResponse.json({
            message: "Student balance updated successfully",
            balance: updatedStudent.accountBalance
        }, { status: 200 });
    } catch (error) {
        console.error("Student balance update error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}