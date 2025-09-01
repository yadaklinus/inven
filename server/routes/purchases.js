const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all purchases
router.get('/', async (req, res) => {
  try {
    const { warehouseId, page = 1, limit = 50, startDate, endDate } = req.query;
    
    const where = {
      isDeleted: false,
      ...(warehouseId && { warehousesId: warehouseId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: { 
          purchaseItem: {
            include: { product: true }
          },
          Supplier: true,
          warehouses: true
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.purchase.count({ where })
    ]);

    res.json({
      purchases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get purchase by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await prisma.purchase.findUnique({
      where: { referenceNo: id },
      include: { 
        purchaseItem: {
          include: { product: true }
        },
        Supplier: true,
        warehouses: true
      }
    });

    if (!purchase || purchase.isDeleted) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    res.json(purchase);

  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new purchase
router.post('/', async (req, res) => {
  try {
    const {
      purchaseItems,
      supplierId,
      taxRate,
      subTotal,
      notes,
      amountPaid,
      grandTotal,
      paidAmount,
      balance,
      warehousesId
    } = req.body;

    if (!purchaseItems || purchaseItems.length === 0) {
      return res.status(400).json({ error: 'Purchase items are required' });
    }

    // Generate reference number
    const referenceNo = `PUR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create purchase with items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the purchase
      const purchase = await tx.purchase.create({
        data: {
          referenceNo,
          supplierId,
          taxRate: parseFloat(taxRate) || 0,
          subTotal: parseFloat(subTotal) || 0,
          notes: notes || '',
          amountPaid: parseFloat(amountPaid) || 0,
          grandTotal: parseFloat(grandTotal) || 0,
          paidAmount: parseFloat(paidAmount) || 0,
          balance: parseFloat(balance) || 0,
          warehousesId
        }
      });

      // Create purchase items
      const createdPurchaseItems = await Promise.all(
        purchaseItems.map(item => 
          tx.purchaseItem.create({
            data: {
              purchaseId: purchase.referenceNo,
              productId: item.productId,
              productName: item.productName,
              cost: parseFloat(item.cost) || 0,
              selectedPrice: parseFloat(item.selectedPrice) || 0,
              priceType: item.priceType || 'wholesale',
              quantity: parseInt(item.quantity) || 0,
              discount: parseFloat(item.discount) || 0,
              total: parseFloat(item.total) || 0,
              profit: parseFloat(item.profit) || 0,
              customRetailPrice: parseFloat(item.customRetailPrice) || null,
              customWholesalePrice: parseFloat(item.customWholesalePrice) || null,
              warehousesId
            }
          })
        )
      );

      // Update or create products
      await Promise.all(
        purchaseItems.map(item => {
          if (item.productId) {
            // Update existing product
            return tx.product.update({
              where: { id: item.productId },
              data: {
                quantity: {
                  increment: parseInt(item.quantity) || 0
                },
                cost: parseFloat(item.cost) || 0,
                wholeSalePrice: parseFloat(item.customWholesalePrice) || undefined,
                retailPrice: parseFloat(item.customRetailPrice) || undefined
              }
            });
          } else if (item.productName) {
            // Create new product
            return tx.product.create({
              data: {
                name: item.productName,
                barcode: `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                cost: parseFloat(item.cost) || 0,
                wholeSalePrice: parseFloat(item.customWholesalePrice) || parseFloat(item.cost) * 1.2,
                retailPrice: parseFloat(item.customRetailPrice) || parseFloat(item.cost) * 1.5,
                quantity: parseInt(item.quantity) || 0,
                taxRate: 0,
                unit: 'piece',
                description: `Auto-created from purchase ${purchase.referenceNo}`,
                warehousesId
              }
            });
          }
        })
      );

      return { purchase, purchaseItems: createdPurchaseItems };
    });

    // Fetch the complete purchase with relations
    const completePurchase = await prisma.purchase.findUnique({
      where: { referenceNo: result.purchase.referenceNo },
      include: { 
        purchaseItem: {
          include: { product: true }
        },
        Supplier: true,
        warehouses: true
      }
    });

    res.status(201).json(completePurchase);

  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update purchase
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.referenceNo;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const purchase = await prisma.purchase.update({
      where: { referenceNo: id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: { 
        purchaseItem: {
          include: { product: true }
        },
        Supplier: true,
        warehouses: true
      }
    });

    res.json(purchase);

  } catch (error) {
    console.error('Update purchase error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete purchase (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.purchase.update({
      where: { referenceNo: id },
      data: {
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Purchase deleted successfully' });

  } catch (error) {
    console.error('Delete purchase error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;