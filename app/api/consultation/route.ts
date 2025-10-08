import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
    const {
        items,
        invoiceNo,
        subtotal,
        totalDiscount,
        taxRate,
        taxAmount,
        grandTotal,
        paymentMethods,
        amountPaid,
        balance,
        notes,
        diagnosis,
        symptoms,
        consultantNotes,
        cashier,
        warehouseId,
        student
    } = await req.json()

    try {
        const warehouse = await offlinePrisma.warehouses.findUnique({
            where: { warehouseCode: warehouseId, isDeleted: false }
        })
            
        if (!warehouse) return NextResponse.json("Warehouse does not exist", { status: 401 })

        const consultation = await offlinePrisma.consultation.create({
            data: {
                invoiceNo,
                subTotal: subtotal,
                taxRate,
                notes,
                diagnosis,
                symptoms,
                consultantNotes,
                amountPaid,
                grandTotal,
                paidAmount: grandTotal - balance,
                balance,
                warehousesId: warehouseId,
                selectedStudentId: student.id
            }
        })

        for (let j = 0; j < items.length; j++) {
            if (items[j].quantity < 0) {
                return NextResponse.json("Invalid quantity", { status: 500 })
            }
        }

        for (let i = 0; i < items.length; i++) {
            const savedConsultationItem = await offlinePrisma.consultationItem.create({
                data: {
                    consultationId: consultation.invoiceNo,
                    productName: items[i].productName,
                    productId: items[i].productId,
                    cost: items[i].costPrice,
                    selectedPrice: items[i].salePrice,
                    priceType: items[i].priceType,
                    quantity: items[i].quantity,
                    dosage: items[i].dosage || "",
                    frequency: items[i].frequency || "",
                    duration: items[i].duration || "",
                    instructions: items[i].instructions || "",
                    discount: items[i].discount,
                    total: items[i].total,
                    warehousesId: warehouseId,
                    studentId: student.id,
                    profit: items[i].salePrice - items[i].costPrice,
                }
            })
            
            // Update product quantity
            await offlinePrisma.product.update({
                where: { id: items[i].productId, isDeleted: false },
                data: {
                    quantity: {
                        decrement: items[i].quantity,
                    },
                    sync: false
                }
            })
        }

        // Create payment methods
        for (let j = 0; j < paymentMethods.length; j++) {
            await offlinePrisma.paymentMethod.create({
                data: {
                    method: paymentMethods[j].method,
                    amount: paymentMethods[j].amount,
                    warehousesId: warehouseId,
                    consultationId: consultation.invoiceNo
                }
            })
        }

        return NextResponse.json("Consultation completed successfully", { status: 200 })
    } catch (error) {
        console.log(error)
        return NextResponse.json(error, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    const { consultationId } = await req.json()
    try {
        const findConsultation = await offlinePrisma.consultation.findMany({
            where: { invoiceNo: consultationId, isDeleted: false }
        })
        
        if (!findConsultation) {
            return NextResponse.json("Consultation not found", { status: 404 })
        }

        await offlinePrisma.consultation.update({
            where: { invoiceNo: consultationId },
            data: { isDeleted: true, sync: false }
        })
        
        return NextResponse.json("Consultation deleted successfully", { status: 200 })
    } catch (error) {
        return NextResponse.json(error, { status: 500 })
    }
}