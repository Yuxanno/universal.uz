/**
 * Centralized Configuration Management
 * All environment variables and app configuration in one place
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5050,
    env: process.env.NODE_ENV || 'development',
    clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/universal-uz',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: {
      admin: '7d',
      cashier: '7d',
      helper: '5y',
    },
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedImageExtensions: /jpeg|jpg|png|gif|webp/,
    productImagesPath: 'uploads/products',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Juda ko\'p so\'rov yuborildi, keyinroq urinib ko\'ring',
  },

  // Telegram Bot Configuration
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    customerBotToken: process.env.TELEGRAM_CUSTOMER_BOT_TOKEN,
  },

  // Pagination
  pagination: {
    defaultLimit: 50,
    maxLimit: 1000,
  },

  // Cache Configuration
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
  },
};

// Validate critical configuration
const validateConfig = () => {
  const errors = [];

  if (!config.jwt.secret) {
    errors.push('JWT_SECRET is required in environment variables');
  }

  if (config.jwt.secret === 'secret') {
    errors.push('JWT_SECRET must not be the default value "secret"');
  }

  if (!config.database.uri) {
    errors.push('MONGODB_URI is required in environment variables');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration Errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
};

// Run validation in production
if (config.server.env === 'production') {
  validateConfig();
}

module.exports = config;
