require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const warehouseRoutes = require('./routes/warehouses');
const inventoryRoutes = require('./routes/inventory');
const customerRoutes = require('./routes/customers');
const debtRoutes = require('./routes/debts');
const orderRoutes = require('./routes/orders');
const receiptRoutes = require('./routes/receipts');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const printerRoutes = require('./routes/printers');
const printRoutes = require('./routes/print');
const telegramRoutes = require('./routes/telegram');

// Telegram Bot
const { initBot } = require('./telegram/bot');
const { initCustomerBot } = require('./telegram/customerBot');

const app = express();

app.use(cors({ 
  origin: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''), 
  credentials: true 
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create HTTP server first
const PORT = process.env.PORT || 5050;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Socket.IO setup - BEFORE routes
const io = require('socket.io')(server, {
  cors: {
    origin: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Export io for use in routes
global.io = io;
console.log('🔌 Socket.IO initialized');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes - AFTER socket setup
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/printers', printerRoutes);
app.use('/api/print', printRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api', printerRoutes); // Also mount at /api for /api/print-label

// Pass socket.io to debts routes
if (debtRoutes.setSocketIO) {
  debtRoutes.setSocketIO(io);
  console.log('✅ Socket.IO connected to debts routes');
}

// Connect to MongoDB with optimized settings
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
  socketTimeoutMS: 45000, // 45 seconds socket timeout
  maxPoolSize: 10, // Maximum 10 connections in pool
  minPoolSize: 2, // Minimum 2 connections always ready
  maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
  retryWrites: true, // Retry failed writes
  retryReads: true, // Retry failed reads
  connectTimeoutMS: 10000, // 10 seconds connection timeout
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_uz', mongooseOptions)
  .then(async () => {
    console.log('MongoDB connected');
    // Drop old indexes to fix unique constraint issues
    try {
      const collection = mongoose.connection.collection('users');
      await collection.dropIndex('email_1').catch(() => {});
      await collection.dropIndex('phone_1').catch(() => {});
      console.log('Cleaned up old indexes');
    } catch (e) {
      // Indexes might not exist, ignore
    }
    
    // Initialize Telegram Bot after MongoDB connection
    initBot();
    
    // Initialize Customer Telegram Bot
    initCustomerBot();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});
