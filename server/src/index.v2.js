/**
 * Server Entry Point (Refactored)
 * Clean, maintainable server setup with proper error handling
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { helmetConfig, apiLimiter, sanitizeInput } = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutesV2 = require('./routes/products.v2');
const productRoutes = require('./routes/products'); // Keep old routes for now
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

// Initialize Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(sanitizeInput);

// CORS configuration
app.use(cors({
  origin: config.server.clientUrl,
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.server.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env,
  });
});

// API routes with rate limiting
app.use('/api', apiLimiter);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/v2/products', productRoutesV2); // New refactored routes
app.use('/api/products', productRoutes); // Old routes (will be deprecated)
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint topilmadi',
      code: 'NOT_FOUND',
      path: req.originalUrl,
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const mongooseOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 10000,
    };

    await mongoose.connect(config.database.uri, mongooseOptions);
    logger.info('✅ MongoDB connected successfully');

    // Clean up old indexes
    try {
      const collection = mongoose.connection.collection('users');
      await collection.dropIndex('email_1').catch(() => {});
      await collection.dropIndex('phone_1').catch(() => {});
      logger.info('Cleaned up old indexes');
    } catch (e) {
      // Indexes might not exist, ignore
    }

    // Initialize Telegram Bots
    initBot();
    initCustomerBot();
    logger.info('✅ Telegram bots initialized');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// MongoDB event handlers
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('✅ MongoDB reconnected');
});

// Start server
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();

    // Create HTTP server
    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running on port ${config.server.port}`);
      logger.info(`📝 Environment: ${config.server.env}`);
      logger.info(`🌐 Client URL: ${config.server.clientUrl}`);
    });

    // Socket.IO setup
    const io = require('socket.io')(server, {
      cors: {
        origin: config.server.clientUrl,
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      logger.debug('Client connected:', socket.id);

      socket.on('disconnect', () => {
        logger.debug('Client disconnected:', socket.id);
      });
    });

    // Export io for use in routes
    global.io = io;
    logger.info('🔌 Socket.IO initialized');

    // Pass socket.io to routes that need it
    if (debtRoutes.setSocketIO) {
      debtRoutes.setSocketIO(io);
      logger.info('✅ Socket.IO connected to debts routes');
    }

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
