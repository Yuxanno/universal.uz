/**
 * Product Service Layer
 * Business logic for product operations
 */

const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const WarehouseInventory = require('../models/WarehouseInventory');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/errors');
const logger = require('../utils/logger');

class ProductService {
  /**
   * Get all products with filters
   */
  async getProducts(filters = {}) {
    try {
      const { search, warehouse, mainOnly, page = 1, limit = 50 } = filters;
      const query = {};

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ];
      }

      // Warehouse filter
      if (warehouse) {
        const warehouseId = await this._resolveWarehouseId(warehouse);
        if (!warehouseId) {
          return [];
        }
        query.warehouse = warehouseId;
      }

      // Main warehouse only filter
      if (mainOnly === true || mainOnly === 'true') {
        query.isMainWarehouse = true;
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const products = await Product.find(query)
        .select('name code price costPrice quantity warehouse image soldCount')
        .populate('warehouse', 'name')
        .sort({ soldCount: -1, _id: -1 })
        .skip(skip)
        .limit(Math.min(limit, 5000))
        .lean()
        .exec();

      return products;
    } catch (error) {
      logger.error('Error fetching products:', error);
      throw new DatabaseError('Mahsulotlarni olishda xatolik');
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id) {
    const product = await Product.findById(id)
      .populate('warehouse', 'name')
      .lean();

    if (!product) {
      throw new NotFoundError('Mahsulot');
    }

    return product;
  }

  /**
   * Create new product
   */
  async createProduct(productData, userId) {
    try {
      // Normalize code
      const normalizedCode = productData.code.trim();

      // Check if code already exists
      await this._checkCodeUniqueness(normalizedCode);

      // Check if name already exists (case-insensitive)
      await this._checkNameUniqueness(productData.name);

      // Verify warehouse exists
      await this._verifyWarehouse(productData.warehouse);

      // Create product
      const product = new Product({
        ...productData,
        code: normalizedCode,
        createdBy: userId,
      });

      await product.save();

      // Populate warehouse before returning
      await product.populate('warehouse', 'name');

      logger.info(`Product created: ${product.name} (${product.code})`, {
        productId: product._id,
        userId,
      });

      return product;
    } catch (error) {
      if (error.isOperational) throw error;
      logger.error('Error creating product:', error);
      throw new DatabaseError('Mahsulot yaratishda xatolik');
    }
  }

  /**
   * Update product
   */
  async updateProduct(id, updateData, userId) {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new NotFoundError('Mahsulot');
      }

      // Check code uniqueness if code is being updated
      if (updateData.code && updateData.code !== product.code) {
        await this._checkCodeUniqueness(updateData.code, id);
      }

      // Check name uniqueness if name is being updated
      if (updateData.name && updateData.name !== product.name) {
        await this._checkNameUniqueness(updateData.name, id);
      }

      // Verify warehouse if being updated
      if (updateData.warehouse && updateData.warehouse !== product.warehouse.toString()) {
        await this._verifyWarehouse(updateData.warehouse);
      }

      // Update product
      Object.assign(product, updateData);
      await product.save();

      await product.populate('warehouse', 'name');

      logger.info(`Product updated: ${product.name} (${product.code})`, {
        productId: product._id,
        userId,
      });

      return product;
    } catch (error) {
      if (error.isOperational) throw error;
      logger.error('Error updating product:', error);
      throw new DatabaseError('Mahsulotni yangilashda xatolik');
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(id, userId) {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new NotFoundError('Mahsulot');
      }

      // Check if product is used in any receipts (optional business rule)
      // You might want to soft delete instead

      await product.deleteOne();

      logger.info(`Product deleted: ${product.name} (${product.code})`, {
        productId: product._id,
        userId,
      });

      return { message: 'Mahsulot o\'chirildi' };
    } catch (error) {
      if (error.isOperational) throw error;
      logger.error('Error deleting product:', error);
      throw new DatabaseError('Mahsulotni o\'chirishda xatolik');
    }
  }

  /**
   * Get next available product code
   */
  async getNextCode(warehouseId = null) {
    try {
      let baseCode = 1;

      if (warehouseId) {
        const warehouse = await Warehouse.findById(warehouseId);
        if (warehouse && warehouse.name !== 'Asosiy ombor') {
          const allWarehouses = await Warehouse.find().sort({ createdAt: 1 });
          const nonMainWarehouses = allWarehouses.filter(w => w.name !== 'Asosiy ombor');
          const warehouseIndex = nonMainWarehouses.findIndex(
            w => w._id.toString() === warehouseId
          );
          if (warehouseIndex >= 0) {
            baseCode = (warehouseIndex + 1) * 100000;
          }
        }
      }

      // Find first available code (fills gaps from deleted products)
      const result = await Product.aggregate([
        {
          $project: {
            numericCode: {
              $convert: {
                input: '$code',
                to: 'int',
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
        {
          $match: {
            numericCode: { $gte: baseCode, $lt: baseCode + 100000 },
          },
        },
        {
          $sort: { numericCode: 1 },
        },
      ]);

      // Find first gap in sequence
      let nextCode = baseCode;
      const usedCodes = new Set(result.map(r => r.numericCode));

      while (usedCodes.has(nextCode) && nextCode < baseCode + 100000) {
        nextCode++;
      }

      return { code: String(nextCode) };
    } catch (error) {
      logger.error('Error getting next code:', error);
      throw new DatabaseError('Keyingi kodni olishda xatolik');
    }
  }

  /**
   * Check if code exists
   */
  async checkCodeExists(code, excludeId = null) {
    const query = { code: code.trim() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const exists = await Product.exists(query);
    return { exists: !!exists };
  }

  /**
   * Update product quantity only
   */
  async updateQuantity(id, quantity, userId) {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new NotFoundError('Mahsulot');
      }

      // Validate quantity
      if (quantity < 0) {
        throw new ConflictError('Miqdor 0 dan kam bo\'lmasligi kerak');
      }

      // Update quantity
      product.quantity = quantity;
      await product.save();

      await product.populate('warehouse', 'name');

      logger.info(`Product quantity updated: ${product.name} (${product.code}) - ${quantity}`, {
        productId: product._id,
        userId,
      });

      return product;
    } catch (error) {
      if (error.isOperational) throw error;
      logger.error('Error updating product quantity:', error);
      throw new DatabaseError('Mahsulot miqdorini yangilashda xatolik');
    }
  }

  // Private helper methods

  async _resolveWarehouseId(warehouse) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(warehouse);
    if (isObjectId) {
      return warehouse;
    }

    const warehouseDoc = await Warehouse.findOne({ name: warehouse }).lean();
    return warehouseDoc?._id || null;
  }

  async _checkCodeUniqueness(code, excludeId = null) {
    const query = { code: code.trim() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Product.findOne(query);
    if (existing) {
      throw new ConflictError(`Kod "${code}" allaqachon mavjud`);
    }
  }

  async _checkNameUniqueness(name, excludeId = null) {
    const query = {
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Product.findOne(query);
    if (existing) {
      throw new ConflictError(`Mahsulot "${name}" allaqachon mavjud`);
    }
  }

  async _verifyWarehouse(warehouseId) {
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundError('Ombor');
    }
    return warehouse;
  }
}

module.exports = new ProductService();
