import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from '@/lib/prisma'

const prismaClient = new PrismaClient()

export async function POST(req:NextRequest){
    const data = await req.json()
    const {username:userName,email,password,role,phone:phoneNumber,warehouse} = data.formData
    try {
        const existUser = await prismaClient.users.findUnique({where:{userName}})

        if(existUser) return NextResponse.json("userNameExist",{status:401})

        const hash = await bcrypt.hash(password,10)
        const user = await prismaClient.users.create({
            data:{
                userName,email,password:hash,role,phoneNumber,warehousesId:warehouse
            }
        }) 
     return NextResponse.json(user,{status:201})
    } catch (error) {
     return NextResponse.json(error,{status:500})
    }finally{
     await prismaClient.$disconnect()
    }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { userName: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        include: {
          warehouses: true,
        },
        orderBy: { userName: 'asc' },
      }),
      prisma.users.count({ where }),
    ])

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        warehouse: user.warehouses?.name || 'No Warehouse',
        lastLogin: user.lastLogin?.toISOString() || null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await prisma.users.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}