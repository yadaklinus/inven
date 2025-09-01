const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all sales
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

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: { 
          saleItems: {
            include: { product: true }
          },
          selectedCustomer: true,
          warehouses: true,
          paymentMethod: true
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.sale.count({ where })
    ]);

    res.json({
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sale by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { invoiceNo: id },
      include: { 
        saleItems: {
          include: { product: true }
        },
        selectedCustomer: true,
        warehouses: true,
        paymentMethod: true,
        balancePayment: true
      }
    });

    if (!sale || sale.isDeleted) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json(sale);

  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new sale
router.post('/', async (req, res) => {
  try {
    const {
      saleItems,
      selectedCustomerId,
      taxRate,
      subTotal,
      notes,
      amountPaid,
      grandTotal,
      paidAmount,
      balance,
      warehousesId,
      paymentMethods
    } = req.body;

    if (!saleItems || saleItems.length === 0) {
      return res.status(400).json({ error: 'Sale items are required' });
    }

    // Generate invoice number
    const invoiceNo = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create sale with items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          invoiceNo,
          selectedCustomerId,
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

      // Create sale items
      const createdSaleItems = await Promise.all(
        saleItems.map(item => 
          tx.saleItem.create({
            data: {
              saleId: sale.invoiceNo,
              productId: item.productId,
              productName: item.productName,
              cost: parseFloat(item.cost) || 0,
              selectedPrice: parseFloat(item.selectedPrice) || 0,
              priceType: item.priceType || 'retail',
              quantity: parseInt(item.quantity) || 0,
              discount: parseFloat(item.discount) || 0,
              total: parseFloat(item.total) || 0,
              profit: parseFloat(item.profit) || 0,
              warehousesId,
              customerId: selectedCustomerId
            }
          })
        )
      );

      // Update product quantities
      await Promise.all(
        saleItems.map(item => {
          if (item.productId) {
            return tx.product.update({
              where: { id: item.productId },
              data: {
                quantity: {
                  decrement: parseInt(item.quantity) || 0
                }
              }
            });
          }
        })
      );

      // Create payment methods if provided
      if (paymentMethods && paymentMethods.length > 0) {
        await Promise.all(
          paymentMethods.map(payment => 
            tx.paymentMethod.create({
              data: {
                method: payment.method,
                amount: parseInt(payment.amount) || 0,
                warehousesId,
                saleId: sale.invoiceNo
              }
            })
          )
        );
      }

      return { sale, saleItems: createdSaleItems };
    });

    // Fetch the complete sale with relations
    const completeSale = await prisma.sale.findUnique({
      where: { invoiceNo: result.sale.invoiceNo },
      include: { 
        saleItems: {
          include: { product: true }
        },
        selectedCustomer: true,
        warehouses: true,
        paymentMethod: true
      }
    });

    res.status(201).json(completeSale);

  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update sale
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.invoiceNo;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const sale = await prisma.sale.update({
      where: { invoiceNo: id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: { 
        saleItems: {
          include: { product: true }
        },
        selectedCustomer: true,
        warehouses: true,
        paymentMethod: true
      }
    });

    res.json(sale);

  } catch (error) {
    console.error('Update sale error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete sale (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.sale.update({
      where: { invoiceNo: id },
      data: {
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Sale deleted successfully' });

  } catch (error) {
    console.error('Delete sale error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sales summary
router.get('/summary/dashboard', async (req, res) => {
  try {
    const { warehouseId, startDate, endDate } = req.query;
    
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

    const [
      totalSales,
      totalRevenue,
      totalProfit,
      averageSaleValue
    ] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.aggregate({
        where,
        _sum: { grandTotal: true }
      }),
      prisma.saleItem.aggregate({
        where: {
          sale: where
        },
        _sum: { profit: true }
      }),
      prisma.sale.aggregate({
        where,
        _avg: { grandTotal: true }
      })
    ]);

    res.json({
      totalSales,
      totalRevenue: totalRevenue._sum.grandTotal || 0,
      totalProfit: totalProfit._sum.profit || 0,
      averageSaleValue: averageSaleValue._avg.grandTotal || 0
    });

  } catch (error) {
    console.error('Get sales summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;