/**
 * Centralized Error Handler Middleware
 * Handles all errors in a consistent way
 */

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new AppError('Noto\'g\'ri ID formati', 400, 'INVALID_ID');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    error = new AppError(
      `${field} "${value}" allaqachon mavjud`,
      409,
      'DUPLICATE_KEY'
    );
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    error = new AppError('Validatsiya xatosi', 400, 'VALIDATION_ERROR');
    error.errors = errors;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token yaroqsiz', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token muddati tugagan', 401, 'TOKEN_EXPIRED');
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('Fayl hajmi juda katta', 400, 'FILE_TOO_LARGE');
    } else {
      error = new AppError('Fayl yuklashda xato', 400, 'FILE_UPLOAD_ERROR');
    }
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || 'INTERNAL_SERVER_ERROR';

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || 'Server xatosi',
      code: errorCode,
      ...(error.errors && { errors: error.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // In production, you might want to gracefully shutdown
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = errorHandler;
