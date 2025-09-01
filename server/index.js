const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaClient: PrismaClientOnline } = require('@prisma/client/generated/online');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Prisma clients
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db'
    }
  }
});

const prismaOnline = new PrismaClientOnline({
  datasources: {
    db_: {
      url: process.env.DATABASE_URL_ONLINE
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from Next.js build
app.use(express.static(path.join(__dirname, '../out')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database connection test
app.get('/api/db/test', async (req, res) => {
  try {
    // Test SQLite connection
    const sqliteTest = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Test PostgreSQL connection (if available)
    let postgresTest = null;
    try {
      postgresTest = await prismaOnline.$queryRaw`SELECT 1 as test`;
    } catch (error) {
      console.log('PostgreSQL not available:', error.message);
    }

    res.json({
      sqlite: { connected: true, data: sqliteTest },
      postgres: { connected: !!postgresTest, data: postgresTest }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import and use API routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const customerRoutes = require('./routes/customers');
const supplierRoutes = require('./routes/suppliers');
const saleRoutes = require('./routes/sales');
const purchaseRoutes = require('./routes/purchases');
const warehouseRoutes = require('./routes/warehouses');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const syncRoutes = require('./routes/sync');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sync', syncRoutes);

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../out/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  await prismaOnline.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  await prismaOnline.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;