const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all warehouses
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { warehouseCode: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [warehouses, total] = await Promise.all([
      prisma.warehouses.findMany({
        where,
        include: { 
          users: true,
          _count: {
            select: {
              products: true,
              customer: true,
              supplier: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.warehouses.count({ where })
    ]);

    res.json({
      warehouses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get warehouse by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await prisma.warehouses.findUnique({
      where: { warehouseCode: id },
      include: { 
        users: true,
        products: true,
        customer: true,
        supplier: true,
        sale: true,
        purchase: true,
        receiptSettings: true
      }
    });

    if (!warehouse || warehouse.isDeleted) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json(warehouse);

  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new warehouse
router.post('/', async (req, res) => {
  try {
    const {
      warehouseCode,
      name,
      phoneNumber,
      email,
      description,
      address
    } = req.body;

    if (!warehouseCode || !name || !phoneNumber || !email) {
      return res.status(400).json({ error: 'Warehouse code, name, phone, and email are required' });
    }

    // Check if warehouse code already exists
    const existingWarehouse = await prisma.warehouses.findUnique({
      where: { warehouseCode }
    });

    if (existingWarehouse) {
      return res.status(400).json({ error: 'Warehouse code already exists' });
    }

    const warehouse = await prisma.warehouses.create({
      data: {
        warehouseCode,
        name,
        phoneNumber,
        email,
        description: description || '',
        address: address || ''
      }
    });

    res.status(201).json(warehouse);

  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update warehouse
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.warehouseCode;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const warehouse = await prisma.warehouses.update({
      where: { warehouseCode: id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    res.json(warehouse);

  } catch (error) {
    console.error('Update warehouse error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete warehouse (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.warehouses.update({
      where: { warehouseCode: id },
      data: {
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Warehouse deleted successfully' });

  } catch (error) {
    console.error('Delete warehouse error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get warehouse statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const [
      productCount,
      customerCount,
      supplierCount,
      saleCount,
      purchaseCount,
      totalSales,
      totalPurchases
    ] = await Promise.all([
      prisma.product.count({
        where: { warehousesId: id, isDeleted: false }
      }),
      prisma.customer.count({
        where: { warehousesId: id, isDeleted: false }
      }),
      prisma.supplier.count({
        where: { warehousesId: id, isDeleted: false }
      }),
      prisma.sale.count({
        where: { warehousesId: id, isDeleted: false }
      }),
      prisma.purchase.count({
        where: { warehousesId: id, isDeleted: false }
      }),
      prisma.sale.aggregate({
        where: { warehousesId: id, isDeleted: false },
        _sum: { grandTotal: true }
      }),
      prisma.purchase.aggregate({
        where: { warehousesId: id, isDeleted: false },
        _sum: { grandTotal: true }
      })
    ]);

    res.json({
      productCount,
      customerCount,
      supplierCount,
      saleCount,
      purchaseCount,
      totalSales: totalSales._sum.grandTotal || 0,
      totalPurchases: totalPurchases._sum.grandTotal || 0
    });

  } catch (error) {
    console.error('Get warehouse stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;