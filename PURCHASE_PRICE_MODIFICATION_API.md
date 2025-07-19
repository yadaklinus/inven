# Purchase Price Modification API

This document outlines the new API endpoints created to allow modification of retail and wholesale prices when adding products to purchases in the dashboard/[id]/admin/purchases section.

## Endpoints Created

### 1. Update Product Prices Globally
**Endpoint:** `PATCH /api/product/update-prices`

Updates the retail and/or wholesale prices for a product globally in the database.

**Request Body:**
```json
{
  "productId": "string", // Product ID or barcode
  "retailPrice": 99.99, // Optional: New retail price
  "wholesalePrice": 79.99, // Optional: New wholesale price
  "warehouseId": "string" // Warehouse ID
}
```

**Response:**
```json
{
  "message": "Product prices updated successfully",
  "product": {
    "id": "string",
    "name": "string",
    "barcode": "string",
    "retailPrice": 99.99,
    "wholesalePrice": 79.99,
    "cost": 65.00,
    "quantity": 100
  }
}
```

### 2. Create Purchase with Custom Prices
**Endpoint:** `POST /api/purchase/create-with-custom-prices`

Creates a purchase order with custom retail and wholesale prices for specific items without permanently updating the product prices.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "string",
      "productName": "string",
      "productBarcode": "string",
      "cost": 65.00,
      "customRetailPrice": 99.99, // Optional: Custom retail price for this purchase only
      "customWholesalePrice": 79.99, // Optional: Custom wholesale price for this purchase only
      "selectedPrice": 79.99,
      "priceType": "wholesale",
      "quantity": 10,
      "discount": 0,
      "total": 799.90
    }
  ],
  "referenceNo": "PO-2024-001",
  "subtotal": 799.90,
  "taxRate": 10,
  "taxAmount": 79.99,
  "shipping": 0,
  "grandTotal": 879.89,
  "paidAmount": 879.89,
  "balance": 0,
  "notes": "string",
  "warehouseId": "string",
  "supplierId": "string",
  "status": "ordered"
}
```

**Response:**
```json
{
  "message": "Purchase order created successfully with custom prices",
  "purchase": {
    "id": "string",
    "referenceNo": "PO-2024-001",
    // ... other purchase details
  }
}
```

### 3. Get Product Prices
**Endpoint:** `GET /api/product/[productId]/prices?warehouseId=string`

Retrieves current pricing information for a specific product.

**Response:**
```json
{
  "productId": "string",
  "name": "string",
  "barcode": "string",
  "prices": {
    "cost": 65.00,
    "retail": 99.99,
    "wholesale": 79.99
  },
  "quantity": 100,
  "unit": "PCS"
}
```

### 4. Update Purchase Product Prices (Legacy)
**Endpoint:** `PATCH /api/purchase/update-product-prices`

Updates product prices during purchase creation (similar to global update but in purchase context).

## Frontend Integration

### Custom Price UI Components

The purchase add page (`/warehouse/[id]/admin/purchases/add`) now includes:

1. **Custom Price Toggle**: A checkbox to enable custom pricing for individual products
2. **Custom Price Inputs**: Separate input fields for custom retail and wholesale prices
3. **Price Comparison**: Shows original prices alongside custom prices
4. **Visual Indicators**: Badges indicating when custom prices are being used

### Usage Flow

1. **Select Product**: Choose a product from the dropdown
2. **Enable Custom Prices**: Check the "Use custom prices for this product" checkbox
3. **Set Custom Prices**: Enter new retail and/or wholesale prices
4. **Select Price Type**: Choose whether to use the retail or wholesale price for this purchase
5. **Add to Purchase**: The item will be added with the custom prices
6. **Create Purchase**: When submitted, the system will:
   - Use the regular `/api/purchase` endpoint if no custom prices are set
   - Use the `/api/purchase/create-with-custom-prices` endpoint if custom prices are detected

### Database Schema Changes

The `PurchaseItem` model has been updated to include:
- `customRetailPrice` (Float?, optional)
- `customWholesalePrice` (Float?, optional)

These fields store the custom prices used for specific purchase items without affecting the global product pricing.

## Error Handling

All endpoints include comprehensive error handling for:
- Missing required fields
- Invalid warehouse IDs
- Non-existent products
- Database connection issues
- Invalid price values

## Security Considerations

- All endpoints validate warehouse access
- Product ownership is verified before updates
- Input validation prevents SQL injection
- Price values are properly sanitized and typed

## Testing

To test the functionality:

1. Navigate to `/warehouse/[warehouseId]/admin/purchases/add`
2. Select a product
3. Enable custom pricing
4. Modify the retail and/or wholesale prices
5. Add the product to the purchase
6. Create the purchase order
7. Verify that custom prices are stored and displayed correctly