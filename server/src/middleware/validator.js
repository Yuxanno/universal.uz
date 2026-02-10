/**
 * Validation Middleware using Joi
 * Centralized validation for all routes
 */

const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

/**
 * Validate request data against Joi schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Return all errors
      allowUnknown: true, // Allow unknown keys
      stripUnknown: true, // Remove unknown keys
    };

    const { error, value } = schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      validationOptions
    );

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(new ValidationError('Validatsiya xatosi', errors));
    }

    // Replace request data with validated data
    req.body = value.body || req.body;
    req.query = value.query || req.query;
    req.params = value.params || req.params;

    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // MongoDB ObjectId validation
  objectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Noto\'g\'ri ID formati'),

  // Phone number validation (Uzbekistan format)
  phone: Joi.string()
    .regex(/^\+998[0-9]{9}$/)
    .message('Telefon raqam +998XXXXXXXXX formatida bo\'lishi kerak'),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(50),
  }),

  // Search query
  search: Joi.string().trim().min(1).max(100),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
  }),
};

module.exports = {
  validate,
  schemas,
  Joi,
};
