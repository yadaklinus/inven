const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all customers
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

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { Warehouses: true },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { 
        Warehouses: true,
        Sale: true,
        balancePayment: true
      }
    });

    if (!customer || customer.isDeleted) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new customer
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

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        type: type || 'INDIVIDUAL',
        companyName: companyName || '',
        email: email || '',
        address: address || '',
        phone,
        warehousesId
      },
      include: { Warehouses: true }
    });

    res.status(201).json(customer);

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: { Warehouses: true }
    });

    res.json(customer);

  } catch (error) {
    console.error('Update customer error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete customer (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.customer.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Customer deleted successfully' });

  } catch (error) {
    console.error('Delete customer error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;