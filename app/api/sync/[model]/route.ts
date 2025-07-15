import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Initialize online database connection
const onlinePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.ONLINE_DATABASE_URL
    }
  }
})

// Verify API key
function verifyApiKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const apiKey = process.env.SYNC_API_KEY

  if (!apiKey) {
    return { valid: false, error: 'Sync API key not configured' }
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' }
  }

  const token = authHeader.substring(7)
  if (token !== apiKey) {
    return { valid: false, error: 'Invalid API key' }
  }

  return { valid: true }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { model: string } }
) {
  try {
    // Verify API key
    const authCheck = verifyApiKey(request)
    if (!authCheck.valid) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: 401 }
      )
    }

    const { model } = params
    const data = await request.json()

    // Validate model name
    const validModels = [
      'superAdmin',
      'users',
      'Settings',
      'Warehouses',
      'Customer',
      'Product',
      'Sale',
      'SaleItem',
      'PaymentMethod'
    ]

    if (!validModels.includes(model)) {
      return NextResponse.json(
        { error: `Invalid model: ${model}` },
        { status: 400 }
      )
    }

    // Remove sync-related fields before inserting to online DB
    const { sync, syncedAt, ...cleanData } = data

    // Insert or update data in online database
    try {
      // @ts-ignore - Dynamic model access
      const result = await onlinePrisma[model].upsert({
        where: { id: cleanData.id },
        update: cleanData,
        create: cleanData
      })

      return NextResponse.json({ 
        success: true, 
        recordId: result.id,
        message: 'Record synced successfully'
      })
    } catch (dbError) {
      console.error(`Database error for ${model}:`, dbError)
      return NextResponse.json(
        { error: `Database error: ${dbError}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get sync status endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: { model: string } }
) {
  try {
    // Verify API key
    const authCheck = verifyApiKey(request)
    if (!authCheck.valid) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: 401 }
      )
    }

    const { model } = params

    // Validate model name
    const validModels = [
      'superAdmin',
      'users',
      'Settings',
      'Warehouses',
      'Customer',
      'Product',
      'Sale',
      'SaleItem',
      'PaymentMethod'
    ]

    if (!validModels.includes(model)) {
      return NextResponse.json(
        { error: `Invalid model: ${model}` },
        { status: 400 }
      )
    }

    // Get count from online database
    // @ts-ignore - Dynamic model access
    const count = await onlinePrisma[model].count()

    return NextResponse.json({
      model,
      count,
      message: 'Status retrieved successfully'
    })

  } catch (error) {
    console.error('Sync status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}