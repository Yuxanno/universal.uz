/**
 * Product Routes (Refactored)
 * Clean, maintainable route definitions with proper separation of concerns
 */

const express = require('express');
const productController = require('../controllers/product.controller');
const { auth, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const productValidators = require('../validators/product.validator');

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Private
 */
router.get(
  '/',
  auth,
  validate(productValidators.list),
  productController.getProducts
);

/**
 * @route   GET /api/products/next-code
 * @desc    Get next available product code
 * @access  Private
 */
router.get(
  '/next-code',
  auth,
  productController.getNextCode
);

/**
 * @route   GET /api/products/check-code/:code
 * @desc    Check if product code exists
 * @access  Private
 */
router.get(
  '/check-code/:code',
  auth,
  validate(productValidators.checkCode),
  productController.checkCode
);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Private
 */
router.get(
  '/:id',
  auth,
  validate(productValidators.getById),
  productController.getProductById
);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (Admin, Cashier)
 */
router.post(
  '/',
  auth,
  authorize('admin', 'cashier'),
  validate(productValidators.create),
  productController.createProduct
);

/**
 * @route   PATCH /api/products/:id/quantity
 * @desc    Update product quantity
 * @access  Private (Admin, Cashier)
 */
router.patch(
  '/:id/quantity',
  auth,
  authorize('admin', 'cashier'),
  validate(productValidators.updateQuantity),
  productController.updateQuantity
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Admin, Cashier)
 */
router.put(
  '/:id',
  auth,
  authorize('admin', 'cashier'),
  validate(productValidators.update),
  productController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  auth,
  authorize('admin'),
  validate(productValidators.delete),
  productController.deleteProduct
);

module.exports = router;
