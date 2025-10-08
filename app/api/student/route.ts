import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";

export async function GET(req: NextRequest) {
    try {
        const students = await offlinePrisma.student.findMany({
            where: { isDeleted: false }
        });
        
        return NextResponse.json(students, { status: 200 });
    } catch (error) {
        console.error("Student fetch error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}

export async function POST(req: NextRequest) {
    const {
        name,
        matricNumber,
        email,
        phone,
        address,
        bloodGroup,
        genotype,
        allergies,
        emergencyContact,
        emergencyPhone,
        department,
        level,
        warehouseId
    } = await req.json()

    try {
        const newStudent = await offlinePrisma.student.create({
            data: {
                name,
                matricNumber,
                email,
                phone,
                address,
                bloodGroup,
                genotype,
                allergies,
                emergencyContact,
                emergencyPhone,
                department,
                level,
                warehousesId: warehouseId,
                sync: false, // New students should be marked as unsynced
                syncedAt: null
            }
        })

        return NextResponse.json({
            message: "Student created successfully",
            student: newStudent
        }, { status: 201 })
    } catch (error) {
        console.error("Student creation error:", error);
        return NextResponse.json(error, { status: 500 })
    } finally {
        await offlinePrisma.$disconnect()
    }
}

export async function PUT(req: NextRequest) {
    const {
        studentId,
        name,
        matricNumber,
        email,
        phone,
        address,
        bloodGroup,
        genotype,
        allergies,
        emergencyContact,
        emergencyPhone,
        department,
        level
    } = await req.json();

    try {
        // Check if student exists
        const existingStudent = await offlinePrisma.student.findUnique({
            where: { id: studentId, isDeleted: false }
        });

        if (!existingStudent) {
            return NextResponse.json("Student does not exist", { status: 404 });
        }

        // Update the student
        const updatedStudent = await offlinePrisma.student.update({
            where: { id: studentId },
            data: {
                name,
                matricNumber,
                email,
                phone,
                address,
                bloodGroup,
                genotype,
                allergies,
                emergencyContact,
                emergencyPhone,
                department,
                level,
                sync: false, // Mark as unsynced since it was updated
                syncedAt: null,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            message: "Student updated successfully",
            student: updatedStudent
        }, { status: 200 });
    } catch (error) {
        console.error("Student update error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}

export async function DELETE(req: NextRequest) {
    const { studentId } = await req.json();

    try {
        const student = await offlinePrisma.student.findUnique({
            where: { id: studentId }
        });

        if (!student) {
            return NextResponse.json("Student does not exist", { status: 404 });
        }

        const deletedStudent = await offlinePrisma.student.update({
            where: { id: studentId },
            data: {
                isDeleted: true,
                sync: false, // Mark as unsynced to sync the deletion
                syncedAt: null,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            message: "Student deleted successfully",
            student: deletedStudent
        }, { status: 200 });
    } catch (error) {
        console.error("Student deletion error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}