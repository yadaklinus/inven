const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get settings
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst({
      where: { isDeleted: false }
    });

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = await prisma.settings.create({
        data: {
          setting_id: 1,
          companyName: 'Your Company',
          companyEmail: 'info@yourcompany.com',
          phoneNumber: '+1234567890',
          websiteURL: 'https://yourcompany.com',
          address: 'Your Address',
          logoUrl: '',
          defaultCurrency: 'USD',
          taxRate: 10,
          mode: 'light',
          itermsPerPage: 20
        }
      });
      return res.json(defaultSettings);
    }

    res.json(settings);

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    const updateData = req.body;

    delete updateData.setting_id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const settings = await prisma.settings.upsert({
      where: { setting_id: 1 },
      update: {
        ...updateData,
        updatedAt: new Date()
      },
      create: {
        setting_id: 1,
        companyName: updateData.companyName || 'Your Company',
        companyEmail: updateData.companyEmail || 'info@yourcompany.com',
        phoneNumber: updateData.phoneNumber || '+1234567890',
        websiteURL: updateData.websiteURL || 'https://yourcompany.com',
        address: updateData.address || 'Your Address',
        logoUrl: updateData.logoUrl || '',
        defaultCurrency: updateData.defaultCurrency || 'USD',
        taxRate: updateData.taxRate || 10,
        mode: updateData.mode || 'light',
        itermsPerPage: updateData.itermsPerPage || 20
      }
    });

    res.json(settings);

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get receipt settings for warehouse
router.get('/receipt/:warehouseId', async (req, res) => {
  try {
    const { warehouseId } = req.params;

    let receiptSettings = await prisma.receiptSettings.findUnique({
      where: { warehousesId: warehouseId }
    });

    if (!receiptSettings) {
      // Create default receipt settings if none exist
      receiptSettings = await prisma.receiptSettings.create({
        data: {
          warehousesId: warehouseId,
          companyName: 'Your Company',
          businessName: 'Your Business',
          address: 'Your Address',
          city: 'Your City',
          state: 'Your State',
          country: 'Your Country',
          phone: '+1234567890',
          email: 'info@yourcompany.com',
          website: 'https://yourcompany.com'
        }
      });
    }

    res.json(receiptSettings);

  } catch (error) {
    console.error('Get receipt settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update receipt settings
router.put('/receipt/:warehouseId', async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.warehousesId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const receiptSettings = await prisma.receiptSettings.upsert({
      where: { warehousesId: warehouseId },
      update: {
        ...updateData,
        updatedAt: new Date()
      },
      create: {
        warehousesId: warehouseId,
        companyName: updateData.companyName || 'Your Company',
        businessName: updateData.businessName || 'Your Business',
        address: updateData.address || 'Your Address',
        city: updateData.city || 'Your City',
        state: updateData.state || 'Your State',
        country: updateData.country || 'Your Country',
        phone: updateData.phone || '+1234567890',
        email: updateData.email || 'info@yourcompany.com',
        website: updateData.website || 'https://yourcompany.com'
      }
    });

    res.json(receiptSettings);

  } catch (error) {
    console.error('Update receipt settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;