const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { PrismaClient: PrismaClientOnline } = require('@prisma/client/generated/online');

const router = express.Router();
const prisma = new PrismaClient();
const prismaOnline = new PrismaClientOnline();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Try to find user in SQLite first
    let user = await prisma.users.findUnique({
      where: { email },
      include: { warehouses: true }
    });

    // If not found in SQLite, try PostgreSQL
    if (!user) {
      const userOnline = await prismaOnline.users_online.findUnique({
        where: { email },
        include: { Warehouses_online: true }
      });

      if (userOnline) {
        // Convert online user format to match offline format
        user = {
          id: userOnline.id,
          email: userOnline.email,
          userName: userOnline.userName,
          phoneNumber: userOnline.phoneNumber,
          role: userOnline.role,
          warehouses: userOnline.Warehouses_online,
          warehousesId: userOnline.warehouses_onlineId,
          lastLogin: userOnline.lastLogin,
          createdAt: userOnline.createdAt,
          updatedAt: userOnline.updatedAt
        };
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    const now = new Date();
    if (user.warehousesId) {
      await prisma.users.update({
        where: { id: user.id },
        data: { lastLogin: now }
      }).catch(() => {
        // If SQLite update fails, try PostgreSQL
        prismaOnline.users_online.update({
          where: { id: user.id },
          data: { lastLogin: now }
        }).catch(console.error);
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        warehouseId: user.warehousesId 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, userName, phoneNumber, password, role, warehousesId } = req.body;

    if (!email || !userName || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in SQLite
    const user = await prisma.users.create({
      data: {
        email,
        userName,
        phoneNumber: phoneNumber || '',
        password: hashedPassword,
        role: role || 'sales',
        warehousesId
      },
      include: { warehouses: true }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user details
    let user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: { warehouses: true }
    });

    if (!user) {
      const userOnline = await prismaOnline.users_online.findUnique({
        where: { id: decoded.userId },
        include: { Warehouses_online: true }
      });

      if (userOnline) {
        user = {
          id: userOnline.id,
          email: userOnline.email,
          userName: userOnline.userName,
          phoneNumber: userOnline.phoneNumber,
          role: userOnline.role,
          warehouses: userOnline.Warehouses_online,
          warehousesId: userOnline.warehouses_onlineId,
          lastLogin: userOnline.lastLogin,
          createdAt: userOnline.createdAt,
          updatedAt: userOnline.updatedAt
        };
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;