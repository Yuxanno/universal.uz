/**
 * Product Controller
 * Handles HTTP requests and responses for product operations
 */

const productService = require('../services/product.service');
const { asyncHandler } = require('../utils/asyncHandler');

class ProductController {
  /**
   * @route   GET /api/products
   * @desc    Get all products with filters
   * @access  Private
   */
  getProducts = asyncHandler(async (req, res) => {
    const products = await productService.getProducts(req.query);
    
    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  });

  /**
   * @route   GET /api/products/:id
   * @desc    Get product by ID
   * @access  Private
   */
  getProductById = asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);
    
    res.json({
      success: true,
      data: product,
    });
  });

  /**
   * @route   POST /api/products
   * @desc    Create new product
   * @access  Private (Admin, Cashier)
   */
  createProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Mahsulot muvaffaqiyatli yaratildi',
      data: product,
    });
  });

  /**
   * @route   PUT /api/products/:id
   * @desc    Update product
   * @access  Private (Admin, Cashier)
   */
  updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(
      req.params.id,
      req.body,
      req.user.id
    );
    
    res.json({
      success: true,
      message: 'Mahsulot muvaffaqiyatli yangilandi',
      data: product,
    });
  });

  /**
   * @route   DELETE /api/products/:id
   * @desc    Delete product
   * @access  Private (Admin)
   */
  deleteProduct = asyncHandler(async (req, res) => {
    const result = await productService.deleteProduct(req.params.id, req.user.id);
    
    res.json({
      success: true,
      message: result.message,
    });
  });

  /**
   * @route   GET /api/products/next-code
   * @desc    Get next available product code
   * @access  Private
   */
  getNextCode = asyncHandler(async (req, res) => {
    const result = await productService.getNextCode(req.query.warehouseId);
    
    res.json({
      success: true,
      data: result,
    });
  });

  /**
   * @route   GET /api/products/check-code/:code
   * @desc    Check if product code exists
   * @access  Private
   */
  checkCode = asyncHandler(async (req, res) => {
    const result = await productService.checkCodeExists(req.params.code);
    
    res.json({
      success: true,
      data: result,
    });
  });
}

module.exports = new ProductController();
