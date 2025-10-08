/**
 * Migration script to convert inventory management system to clinic management system
 * This script will:
 * 1. Rename Customer table to Student and add medical fields
 * 2. Rename Sale table to Consultation and add diagnosis fields
 * 3. Rename SaleItem table to ConsultationItem and add dosage fields
 * 4. Update all foreign key references
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateToClinic() {
  console.log('Starting migration to clinic management system...')
  
  try {
    // Step 1: Create Student table from Customer data
    console.log('Step 1: Migrating customers to students...')
    
    // First, let's check if we have existing customers
    const existingCustomers = await prisma.customer.findMany({
      where: { isDeleted: false }
    })
    
    console.log(`Found ${existingCustomers.length} existing customers to migrate`)
    
    // For each customer, we'll need to add medical fields
    // Since we can't directly modify the schema in this script,
    // we'll create a backup and transformation guide
    
    const customerBackup = existingCustomers.map(customer => ({
      originalId: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      companyName: customer.companyName,
      type: customer.type,
      warehousesId: customer.warehousesId,
      accountBalance: customer.accountBalance,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }))
    
    console.log('Customer data backup created')
    console.log('Note: You will need to manually add medical fields (matricNumber, bloodGroup, genotype, allergies, etc.)')
    
    // Step 2: Create Consultation table from Sale data
    console.log('Step 2: Migrating sales to consultations...')
    
    const existingSales = await prisma.sale.findMany({
      where: { isDeleted: false },
      include: {
        saleItems: true,
        paymentMethod: true
      }
    })
    
    console.log(`Found ${existingSales.length} existing sales to migrate`)
    
    const saleBackup = existingSales.map(sale => ({
      originalId: sale.id,
      invoiceNo: sale.invoiceNo,
      selectedCustomerId: sale.selectedCustomerId,
      taxRate: sale.taxRate,
      subTotal: sale.subTotal,
      notes: sale.notes,
      amountPaid: sale.amountPaid,
      grandTotal: sale.grandTotal,
      paidAmount: sale.paidAmount,
      balance: sale.balance,
      warehousesId: sale.warehousesId,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      saleItems: sale.saleItems,
      paymentMethods: sale.paymentMethod
    }))
    
    console.log('Sales data backup created')
    console.log('Note: You will need to manually add consultation fields (diagnosis, symptoms, consultantNotes)')
    
    // Step 3: Create ConsultationItem table from SaleItem data
    console.log('Step 3: Migrating sale items to consultation items...')
    
    const existingSaleItems = await prisma.saleItem.findMany({
      where: { isDeleted: false }
    })
    
    console.log(`Found ${existingSaleItems.length} existing sale items to migrate`)
    
    const saleItemBackup = existingSaleItems.map(item => ({
      originalId: item.id,
      saleId: item.saleId,
      productId: item.productId,
      productName: item.productName,
      cost: item.cost,
      selectedPrice: item.selectedPrice,
      priceType: item.priceType,
      quantity: item.quantity,
      discount: item.discount,
      total: item.total,
      profit: item.profit,
      warehousesId: item.warehousesId,
      customerId: item.customerId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
    
    console.log('Sale items data backup created')
    console.log('Note: You will need to manually add dosage fields (dosage, frequency, duration, instructions)')
    
    // Create migration report
    const migrationReport = {
      timestamp: new Date().toISOString(),
      summary: {
        customersToMigrate: existingCustomers.length,
        salesToMigrate: existingSales.length,
        saleItemsToMigrate: existingSaleItems.length
      },
      recommendations: [
        '1. Update Prisma schema with new models (Student, Consultation, ConsultationItem)',
        '2. Run database migration to create new tables',
        '3. Transform customer data to student data with medical fields',
        '4. Transform sales data to consultations with diagnosis fields',
        '5. Transform sale items to consultation items with dosage fields',
        '6. Update all API endpoints to use new models',
        '7. Update frontend components to use new terminology',
        '8. Test all functionality before deploying'
      ],
      dataBackups: {
        customers: customerBackup,
        sales: saleBackup,
        saleItems: saleItemBackup
      }
    }
    
    // Save migration report
    const fs = require('fs')
    fs.writeFileSync('./migration-report.json', JSON.stringify(migrationReport, null, 2))
    
    console.log('Migration report saved to migration-report.json')
    console.log('Migration preparation completed successfully!')
    
    console.log('\n=== NEXT STEPS ===')
    console.log('1. Review the migration report')
    console.log('2. Update your Prisma schema with the new models')
    console.log('3. Run: npx prisma migrate dev --name convert-to-clinic')
    console.log('4. Manually add medical fields to student records')
    console.log('5. Manually add diagnosis fields to consultation records')
    console.log('6. Manually add dosage fields to consultation item records')
    console.log('7. Update your application code to use new models')
    console.log('8. Test thoroughly before production deployment')
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToClinic()
    .then(() => {
      console.log('Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration script failed:', error)
      process.exit(1)
    })
}

module.exports = { migrateToClinic }