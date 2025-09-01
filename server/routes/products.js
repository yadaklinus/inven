const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PrismaClient: PrismaClientOnline } = require('@prisma/client/generated/online');

const router = express.Router();
const prisma = new PrismaClient();
const prismaOnline = new PrismaClientOnline();

// Get all products
router.get('/', async (req, res) => {
  try {
    const { warehouseId, search, page = 1, limit = 50 } = req.query;
    
    const where = {
      isDeleted: false,
      ...(warehouseId && { warehousesId: warehouseId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { warehouses: true },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { warehouses: true }
    });

    if (!product || product.isDeleted) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      barcode,
      wholeSalePrice,
      retailPrice,
      cost,
      quantity,
      taxRate,
      unit,
      description,
      warehousesId
    } = req.body;

    if (!name || !barcode) {
      return res.status(400).json({ error: 'Name and barcode are required' });
    }

    // Check if barcode already exists
    const existingProduct = await prisma.product.findFirst({
      where: { barcode, isDeleted: false }
    });

    if (existingProduct) {
      return res.status(400).json({ error: 'Product with this barcode already exists' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        barcode,
        wholeSalePrice: parseFloat(wholeSalePrice) || 0,
        retailPrice: parseFloat(retailPrice) || 0,
        cost: parseFloat(cost) || 0,
        quantity: parseInt(quantity) || 0,
        taxRate: parseInt(taxRate) || 0,
        unit: unit || 'piece',
        description: description || '',
        warehousesId
      },
      include: { warehouses: true }
    });

    res.status(201).json(product);

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: { warehouses: true }
    });

    res.json(product);

  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Delete product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product quantity
router.patch('/:id/quantity', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.body;

    if (typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Quantity must be a number' });
    }

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product || product.isDeleted) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let newQuantity;
    if (operation === 'add') {
      newQuantity = product.quantity + quantity;
    } else if (operation === 'subtract') {
      newQuantity = Math.max(0, product.quantity - quantity);
    } else {
      newQuantity = quantity;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        quantity: newQuantity,
        updatedAt: new Date()
      },
      include: { warehouses: true }
    });

    res.json(updatedProduct);

  } catch (error) {
    console.error('Update quantity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get low stock products
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const { threshold = 10, warehouseId } = req.query;

    const where = {
      isDeleted: false,
      quantity: { lte: parseInt(threshold) },
      ...(warehouseId && { warehousesId: warehouseId })
    };

    const products = await prisma.product.findMany({
      where,
      include: { warehouses: true },
      orderBy: { quantity: 'asc' }
    });

    res.json(products);

  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;