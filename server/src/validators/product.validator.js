/**
 * Product Validation Schemas
 */

const { Joi, schemas } = require('../middleware/validator');

const productValidators = {
  // Create product
  create: Joi.object({
    body: Joi.object({
      code: Joi.string().trim().required().messages({
        'string.empty': 'Kod kiritilishi shart',
        'any.required': 'Kod kiritilishi shart',
      }),
      name: Joi.string().trim().required().min(2).max(200).messages({
        'string.empty': 'Mahsulot nomi kiritilishi shart',
        'any.required': 'Mahsulot nomi kiritilishi shart',
        'string.min': 'Mahsulot nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Mahsulot nomi 200 ta belgidan oshmasligi kerak',
      }),
      price: Joi.number().min(0).required().messages({
        'number.base': 'Narx raqam bo\'lishi kerak',
        'number.min': 'Narx 0 dan kichik bo\'lmasligi kerak',
        'any.required': 'Narx kiritilishi shart',
      }),
      costPrice: Joi.number().min(0).default(0),
      retailPrice: Joi.number().min(0).optional(),
      dona_narx: Joi.number().min(0).optional(),
      quantity: Joi.number().integer().min(0).default(0),
      warehouse: schemas.objectId.required().messages({
        'any.required': 'Ombor tanlanishi shart',
      }),
      category: Joi.string().trim().max(100).optional(),
      minStock: Joi.number().integer().min(0).default(5),
      variants: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          description: Joi.string().optional(),
          price: Joi.number().min(0).optional(),
          code: Joi.string().optional(),
          quantity: Joi.number().integer().min(0).default(0),
          isActive: Joi.boolean().default(true),
        })
      ).optional(),
      packages: Joi.array().items(
        Joi.object({
          packageCount: Joi.number().integer().min(1).required(),
          unitsPerPackage: Joi.number().integer().min(1).required(),
          totalCost: Joi.number().min(0).required(),
          costPerUnit: Joi.number().min(0).required(),
        })
      ).optional(),
    }),
  }),

  // Update product
  update: Joi.object({
    params: Joi.object({
      id: schemas.objectId.required(),
    }),
    body: Joi.object({
      code: Joi.string().trim().optional(),
      name: Joi.string().trim().min(2).max(200).optional(),
      price: Joi.number().min(0).optional(),
      costPrice: Joi.number().min(0).optional(),
      retailPrice: Joi.number().min(0).optional(),
      dona_narx: Joi.number().min(0).optional(),
      quantity: Joi.number().integer().min(0).optional(),
      warehouse: schemas.objectId.optional(),
      category: Joi.string().trim().max(100).optional(),
      minStock: Joi.number().integer().min(0).optional(),
      variants: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          description: Joi.string().optional(),
          price: Joi.number().min(0).optional(),
          code: Joi.string().optional(),
          quantity: Joi.number().integer().min(0).default(0),
          isActive: Joi.boolean().default(true),
        })
      ).optional(),
      packages: Joi.array().items(
        Joi.object({
          packageCount: Joi.number().integer().min(1).required(),
          unitsPerPackage: Joi.number().integer().min(1).required(),
          totalCost: Joi.number().min(0).required(),
          costPerUnit: Joi.number().min(0).required(),
        })
      ).optional(),
    }).min(1), // At least one field must be provided
  }),

  // Get product by ID
  getById: Joi.object({
    params: Joi.object({
      id: schemas.objectId.required(),
    }),
  }),

  // Delete product
  delete: Joi.object({
    params: Joi.object({
      id: schemas.objectId.required(),
    }),
  }),

  // Get products list
  list: Joi.object({
    query: Joi.object({
      search: schemas.search.optional(),
      warehouse: Joi.alternatives().try(
        schemas.objectId,
        Joi.string().trim()
      ).optional(),
      mainOnly: Joi.boolean().optional(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(5000).default(50),
    }),
  }),

  // Check code availability
  checkCode: Joi.object({
    params: Joi.object({
      code: Joi.string().trim().required(),
    }),
  }),
};

module.exports = productValidators;
