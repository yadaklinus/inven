-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "warehousesId" TEXT NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    CONSTRAINT "Customer_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses" ("warehouseCode") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "companyName", "email", "id", "name", "phone", "type", "warehousesId") SELECT "address", "companyName", "email", "id", "name", "phone", "type", "warehousesId" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE TABLE "new_PaymentMethod" (
    "is" TEXT NOT NULL PRIMARY KEY,
    "method" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "warehousesId" TEXT,
    "saleId" TEXT,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    CONSTRAINT "PaymentMethod_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses" ("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PaymentMethod_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("invoiceNo") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PaymentMethod" ("amount", "is", "method", "saleId", "warehousesId") SELECT "amount", "is", "method", "saleId", "warehousesId" FROM "PaymentMethod";
DROP TABLE "PaymentMethod";
ALTER TABLE "new_PaymentMethod" RENAME TO "PaymentMethod";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "wholeSalePrice" REAL NOT NULL,
    "retailPrice" REAL NOT NULL,
    "cost" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "taxRate" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "warehousesId" TEXT,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    CONSTRAINT "Product_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses" ("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("barcode", "cost", "description", "id", "name", "quantity", "retailPrice", "taxRate", "unit", "warehousesId", "wholeSalePrice") SELECT "barcode", "cost", "description", "id", "name", "quantity", "retailPrice", "taxRate", "unit", "warehousesId", "wholeSalePrice" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "selectedCustomerId" TEXT,
    "taxRate" REAL NOT NULL,
    "subTotal" REAL NOT NULL,
    "notes" TEXT,
    "amountPaid" REAL,
    "grandTotal" REAL NOT NULL,
    "paidAmount" REAL NOT NULL,
    "balance" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehousesId" TEXT,
    "invoiceNo" TEXT NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    CONSTRAINT "Sale_selectedCustomerId_fkey" FOREIGN KEY ("selectedCustomerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses" ("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("amountPaid", "balance", "createdAt", "grandTotal", "id", "invoiceNo", "notes", "paidAmount", "selectedCustomerId", "subTotal", "taxRate", "warehousesId") SELECT "amountPaid", "balance", "createdAt", "grandTotal", "id", "invoiceNo", "notes", "paidAmount", "selectedCustomerId", "subTotal", "taxRate", "warehousesId" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_invoiceNo_key" ON "Sale"("invoiceNo");
CREATE TABLE "new_SaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "cost" REAL NOT NULL,
    "selectedPrice" REAL NOT NULL,
    "priceType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discount" REAL NOT NULL,
    "total" REAL NOT NULL,
    "profit" REAL NOT NULL,
    "warehousesId" TEXT,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("invoiceNo") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("barcode") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses" ("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SaleItem" ("cost", "discount", "id", "priceType", "productId", "productName", "profit", "quantity", "saleId", "selectedPrice", "total", "warehousesId") SELECT "cost", "discount", "id", "priceType", "productId", "productName", "profit", "quantity", "saleId", "selectedPrice", "total", "warehousesId" FROM "SaleItem";
DROP TABLE "SaleItem";
ALTER TABLE "new_SaleItem" RENAME TO "SaleItem";
CREATE TABLE "new_Settings" (
    "setting_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "websiteURL" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL,
    "taxRate" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "itermsPerPage" INTEGER NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME
);
INSERT INTO "new_Settings" ("address", "companyEmail", "companyName", "defaultCurrency", "itermsPerPage", "logoUrl", "mode", "phoneNumber", "setting_id", "taxRate", "websiteURL") SELECT "address", "companyEmail", "companyName", "defaultCurrency", "itermsPerPage", "logoUrl", "mode", "phoneNumber", "setting_id", "taxRate", "websiteURL" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE TABLE "new_Warehouses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME
);
INSERT INTO "new_Warehouses" ("address", "description", "email", "id", "name", "phoneNumber", "warehouseCode") SELECT "address", "description", "email", "id", "name", "phoneNumber", "warehouseCode" FROM "Warehouses";
DROP TABLE "Warehouses";
ALTER TABLE "new_Warehouses" RENAME TO "Warehouses";
CREATE UNIQUE INDEX "Warehouses_warehouseCode_key" ON "Warehouses"("warehouseCode");
CREATE TABLE "new_superAdmin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "lastLogin" DATETIME,
    "warehousesId" TEXT,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME
);
INSERT INTO "new_superAdmin" ("email", "id", "lastLogin", "password", "role", "userName", "warehousesId") SELECT "email", "id", "lastLogin", "password", "role", "userName", "warehousesId" FROM "superAdmin";
DROP TABLE "superAdmin";
ALTER TABLE "new_superAdmin" RENAME TO "superAdmin";
CREATE UNIQUE INDEX "superAdmin_email_key" ON "superAdmin"("email");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "warehousesId" TEXT,
    "lastLogin" DATETIME,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    CONSTRAINT "users_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses" ("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("email", "id", "lastLogin", "password", "phoneNumber", "role", "userName", "warehousesId") SELECT "email", "id", "lastLogin", "password", "phoneNumber", "role", "userName", "warehousesId" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_userName_key" ON "users"("userName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
