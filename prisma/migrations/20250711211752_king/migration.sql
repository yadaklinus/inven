-- CreateEnum
CREATE TYPE "mode" AS ENUM ('dark', 'light');

-- CreateEnum
CREATE TYPE "role" AS ENUM ('admin', 'sales', 'purchase');

-- CreateEnum
CREATE TYPE "unit" AS ENUM ('kg', 'piece', 'liter', 'meter');

-- CreateEnum
CREATE TYPE "type" AS ENUM ('retail', 'wholesale');

-- CreateTable
CREATE TABLE "superAdmin" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "warehousesId" TEXT,

    CONSTRAINT "superAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "role" NOT NULL,
    "warehousesId" TEXT,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "setting_id" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "websiteURL" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL,
    "taxRate" INTEGER NOT NULL,
    "mode" "mode" NOT NULL,
    "itermsPerPage" INTEGER NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("setting_id")
);

-- CreateTable
CREATE TABLE "Warehouses" (
    "id" TEXT NOT NULL,
    "warehouseCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,

    CONSTRAINT "Warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "selectedCustomerId" TEXT,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "amountPaid" DOUBLE PRECISION,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehousesId" TEXT,
    "invoiceNo" TEXT NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "type" NOT NULL,
    "warehousesId" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "selectedPrice" DOUBLE PRECISION NOT NULL,
    "priceType" "type" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "warehousesId" TEXT,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "wholeSalePrice" DOUBLE PRECISION NOT NULL,
    "retailPrice" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "taxRate" INTEGER NOT NULL,
    "unit" "unit" NOT NULL,
    "description" TEXT NOT NULL,
    "warehousesId" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "superAdmin_email_key" ON "superAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_userName_key" ON "users"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouses_warehouseCode_key" ON "Warehouses"("warehouseCode");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_invoiceNo_key" ON "Sale"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_selectedCustomerId_fkey" FOREIGN KEY ("selectedCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("invoiceNo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("barcode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses"("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE;
