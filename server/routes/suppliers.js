const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const { warehouseId, search, page = 1, limit = 50 } = req.query;
    
    const where = {
      isDeleted: false,
      ...(warehouseId && { warehousesId: warehouseId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: { Warehouses: true },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.supplier.count({ where })
    ]);

    res.json({
      suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { 
        Warehouses: true,
        purchase: true
      }
    });

    if (!supplier || supplier.isDeleted) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);

  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new supplier
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      companyName,
      email,
      address,
      phone,
      warehousesId
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        type: type || 'COMPANY',
        companyName: companyName || '',
        email,
        address: address || '',
        phone,
        warehousesId
      },
      include: { Warehouses: true }
    });

    res.status(201).json(supplier);

  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: { Warehouses: true }
    });

    res.json(supplier);

  } catch (error) {
    console.error('Update supplier error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete supplier (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.supplier.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Supplier deleted successfully' });

  } catch (error) {
    console.error('Delete supplier error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;