/**
 * Authentication & Authorization Middleware
 * Refactored with proper error handling
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Verify JWT token and attach user to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token topilmadi');
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    if (!config.jwt.secret) {
      logger.error('JWT_SECRET is not configured');
      throw new Error('Server configuration error');
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AuthenticationError('Foydalanuvchi topilmadi');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Token yaroqsiz'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token muddati tugagan'));
    }
    next(error);
  }
};

/**
 * Check if user has required role(s)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
      });
      return next(new AuthorizationError('Bu amalni bajarish uchun ruxsat yo\'q'));
    }

    next();
  };
};

/**
 * Optional auth - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed:', error.message);
  }
  next();
};

module.exports = { auth, authorize, optionalAuth };
