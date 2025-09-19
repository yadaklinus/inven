-- CreateEnum
CREATE TYPE "mode_online" AS ENUM ('dark', 'light');

-- CreateEnum
CREATE TYPE "role_online" AS ENUM ('admin', 'sales', 'purchase');

-- CreateEnum
CREATE TYPE "unit_online" AS ENUM ('kg', 'piece', 'liter', 'meter');

-- CreateEnum
CREATE TYPE "type_online" AS ENUM ('COMPANY', 'INDIVIDUAL', 'GOVERNMENT', 'NON_PROFIT', 'retal', 'wholesale');

-- CreateTable
CREATE TABLE "superAdmin_online" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "warehousesId" TEXT,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "superAdmin_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_online" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "role_online" NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "warehouses_onlineId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings_online" (
    "setting_id" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "websiteURL" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL,
    "taxRate" INTEGER NOT NULL,
    "mode" "mode_online" NOT NULL,
    "itermsPerPage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Settings_online_pkey" PRIMARY KEY ("setting_id")
);

-- CreateTable
CREATE TABLE "Warehouses_online" (
    "id" TEXT NOT NULL,
    "warehouseCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Warehouses_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale_online" (
    "id" TEXT NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "amountPaid" DOUBLE PRECISION,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "warehouses_onlineId" TEXT,
    "customer_onlineId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Sale_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem_online" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "selectedPrice" DOUBLE PRECISION NOT NULL,
    "priceType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "warehouses_onlineId" TEXT,
    "sale_onlineId" TEXT,
    "customer_onlineId" TEXT,
    "product_onlineId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SaleItem_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase_online" (
    "id" TEXT NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "amountPaid" DOUBLE PRECISION,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "warehouses_onlineId" TEXT,
    "supplier_onlineId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Purchase_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem_online" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "cost" DOUBLE PRECISION NOT NULL,
    "selectedPrice" DOUBLE PRECISION NOT NULL,
    "productName" TEXT,
    "priceType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "customRetailPrice" DOUBLE PRECISION,
    "customWholesalePrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "warehouses_onlineId" TEXT,
    "purchase_onlineId" TEXT,
    "product_onlineId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PurchaseItem_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer_online" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "address" TEXT,
    "phone" TEXT NOT NULL,
    "accountBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "warehouses_onlineId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Customer_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceTransaction_online" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "reference" TEXT,
    "saleId" TEXT,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "warehouses_onlineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BalanceTransaction_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier_online" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "warehouses_onlineId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Supplier_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product_online" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "wholeSalePrice" DOUBLE PRECISION NOT NULL,
    "retailPrice" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "taxRate" INTEGER NOT NULL,
    "unit" "unit_online" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "warehouses_onlineId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Product_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod_online" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "warehouses_onlineId" TEXT,
    "sale_onlineId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PaymentMethod_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptSettings_online" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "receiptTitle" TEXT,
    "headerMessage" TEXT,
    "footerMessage" TEXT,
    "showLogo" BOOLEAN DEFAULT true,
    "logoUrl" TEXT,
    "showQrCode" BOOLEAN DEFAULT true,
    "qrCodeContent" TEXT DEFAULT 'website',
    "customQrContent" TEXT,
    "showCustomerInfo" BOOLEAN DEFAULT true,
    "showCashierInfo" BOOLEAN DEFAULT true,
    "showItemCodes" BOOLEAN DEFAULT true,
    "showItemDescriptions" BOOLEAN DEFAULT true,
    "showTaxBreakdown" BOOLEAN DEFAULT true,
    "showPaymentMethods" BOOLEAN DEFAULT true,
    "showBalance" BOOLEAN DEFAULT true,
    "showTimestamp" BOOLEAN DEFAULT true,
    "use24HourFormat" BOOLEAN DEFAULT false,
    "showItemNumbers" BOOLEAN DEFAULT true,
    "showRunningTotal" BOOLEAN DEFAULT false,
    "paperSize" TEXT DEFAULT '80mm',
    "fontSize" TEXT DEFAULT 'normal',
    "printDensity" TEXT DEFAULT 'normal',
    "lineSpacing" TEXT DEFAULT 'normal',
    "primaryColor" TEXT DEFAULT '#000000',
    "accentColor" TEXT DEFAULT '#666666',
    "fontFamily" TEXT DEFAULT 'monospace',
    "printCopyCount" INTEGER DEFAULT 1,
    "autoPrint" BOOLEAN DEFAULT false,
    "language" TEXT DEFAULT 'en',
    "currency" TEXT DEFAULT 'NGN',
    "currencySymbol" TEXT DEFAULT '₦',
    "currencyPosition" TEXT DEFAULT 'before',
    "warehouses_onlineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReceiptSettings_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalancePayment_online" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "saleId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "notes" TEXT,
    "warehousesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BalancePayment_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation_online" (
    "id" TEXT NOT NULL,
    "selectedCustomerId" TEXT,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "convertedToSaleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "warehousesId" TEXT,
    "quotationNo" TEXT NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Quotation_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem_online" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "selectedPrice" DOUBLE PRECISION NOT NULL,
    "priceType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "warehousesId" TEXT,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuotationItem_online_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "superAdmin_online_email_key" ON "superAdmin_online"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_online_userName_key" ON "users_online"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouses_online_warehouseCode_key" ON "Warehouses_online"("warehouseCode");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_online_invoiceNo_key" ON "Sale_online"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_online_referenceNo_key" ON "Purchase_online"("referenceNo");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptSettings_online_warehouses_onlineId_key" ON "ReceiptSettings_online"("warehouses_onlineId");

-- CreateIndex
CREATE UNIQUE INDEX "BalancePayment_online_receiptNo_key" ON "BalancePayment_online"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_online_quotationNo_key" ON "Quotation_online"("quotationNo");

-- AddForeignKey
ALTER TABLE "users_online" ADD CONSTRAINT "users_online_warehouses_onlineId_fkey" FOREIGN KEY ("warehouses_onlineId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale_online" ADD CONSTRAINT "Sale_online_warehouses_onlineId_fkey" FOREIGN KEY ("warehouses_onlineId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale_online" ADD CONSTRAINT "Sale_online_customer_onlineId_fkey" FOREIGN KEY ("customer_onlineId") REFERENCES "Customer_online"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem_online" ADD CONSTRAINT "SaleItem_online_warehouses_onlineId_fkey" FOREIGN KEY ("warehouses_onlineId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem_online" ADD CONSTRAINT "SaleItem_online_sale_onlineId_fkey" FOREIGN KEY ("sale_onlineId") REFERENCES "Sale_online"("invoiceNo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem_online" ADD CONSTRAINT "SaleItem_online_customer_onlineId_fkey" FOREIGN KEY ("customer_onlineId") REFERENCES "Customer_online"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem_online" ADD CONSTRAINT "SaleItem_online_product_onlineId_fkey" FOREIGN KEY ("product_onlineId") REFERENCES "Product_online"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase_online" ADD CONSTRAINT "Purchase_online_warehouses_onlineId_fkey" FOREIGN KEY ("warehouses_onlineId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase_online" ADD CONSTRAINT "Purchase_online_supplier_onlineId_fkey" FOREIGN KEY ("supplier_onlineId") REFERENCES "Supplier_online"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem_online" ADD CONSTRAINT "PurchaseItem_online_warehouses_onlineId_fkey" FOREIGN KEY ("warehouses_onlineId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem_online" ADD CONSTRAINT "PurchaseItem_online_purchase_onlineId_fkey" FOREIGN KEY ("purchase_onlineId") REFERENCES "Purchase_online"("referenceNo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem_online" ADD CONSTRAINT "PurchaseItem_online_product_onlineId_fkey" FOREIGN KEY ("product_onlineId") REFERENCES "Product_online"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer_online" ADD CONSTRAINT "Customer_online_warehouses_onlineId_fkey" FOREIGN KEY ("warehouses_onlineId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceTransaction_online" ADD CONSTRAINT "BalanceTransaction_online_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer_online"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceTransaction_online" ADD CONSTRAINT "BalanceTransaction_online_warehouses_onlineId_fkey" FOREIGN KEY ("warehouses_onlineId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier_online" ADD CONSTRAINT "Supplier_online_warehouses_onlineId_fkey" FOREIGN KEY ("warehouses_onlineId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product_online" ADD CONSTRAINT "Product_online_warehouses_onlineId_fkey" FOREIGN KEY ("warehouses_onlineId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod_online" ADD CONSTRAINT "PaymentMethod_online_warehouses_onlineId_fkey" FOREIGN KEY ("warehouses_onlineId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod_online" ADD CONSTRAINT "PaymentMethod_online_sale_onlineId_fkey" FOREIGN KEY ("sale_onlineId") REFERENCES "Sale_online"("invoiceNo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptSettings_online" ADD CONSTRAINT "ReceiptSettings_online_warehouses_onlineId_fkey" FOREIGN KEY ("warehouses_onlineId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalancePayment_online" ADD CONSTRAINT "BalancePayment_online_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer_online"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalancePayment_online" ADD CONSTRAINT "BalancePayment_online_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale_online"("invoiceNo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalancePayment_online" ADD CONSTRAINT "BalancePayment_online_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation_online" ADD CONSTRAINT "Quotation_online_selectedCustomerId_fkey" FOREIGN KEY ("selectedCustomerId") REFERENCES "Customer_online"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation_online" ADD CONSTRAINT "Quotation_online_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem_online" ADD CONSTRAINT "QuotationItem_online_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation_online"("quotationNo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem_online" ADD CONSTRAINT "QuotationItem_online_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product_online"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem_online" ADD CONSTRAINT "QuotationItem_online_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses_online"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;
