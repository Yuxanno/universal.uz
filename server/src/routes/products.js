const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const WarehouseInventory = require('../models/WarehouseInventory');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Faqat rasm fayllari ruxsat etilgan!'));
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { search, warehouse, mainOnly } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Фильтрация по складу - поддержка как ID, так и названия склада
    if (warehouse) {
      // Проверяем, является ли warehouse ObjectId или названием
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(warehouse);
      if (isObjectId) {
        query.warehouse = warehouse;
      } else {
        // Ищем склад по названию
        const warehouseDoc = await Warehouse.findOne({ name: warehouse }).lean();
        if (warehouseDoc) {
          query.warehouse = warehouseDoc._id;
        } else {
          // Если склад не найден, возвращаем пустой массив
          return res.json([]);
        }
      }
    }
    
    if (mainOnly === 'true') query.isMainWarehouse = true;

    // ОПТИМИЗАЦИЯ: Используем индексы и минимальные поля
    const products = await Product.find(query)
      .select('name code price costPrice quantity warehouse image soldCount') // Убрали createdAt из select
      .populate('warehouse', 'name')
      .sort({ soldCount: -1, _id: -1 }) // Используем _id вместо createdAt (быстрее)
      .lean() // Возвращает plain JavaScript objects
      .limit(5000) // Ограничение для безопасности
      .exec();
    
    res.json(products);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Get next auto-generated code
router.get('/next-code', auth, async (req, res) => {
  try {
    const { warehouseId } = req.query;
    
    // Determine the starting code based on warehouse
    let baseCode = 1;
    if (warehouseId) {
      const warehouse = await Warehouse.findById(warehouseId);
      if (warehouse && warehouse.name !== 'Asosiy ombor') {
        // Get warehouse index (excluding main warehouse)
        const allWarehouses = await Warehouse.find().sort({ createdAt: 1 });
        const nonMainWarehouses = allWarehouses.filter(w => w.name !== 'Asosiy ombor');
        const warehouseIndex = nonMainWarehouses.findIndex(w => w._id.toString() === warehouseId);
        if (warehouseIndex >= 0) {
          baseCode = (warehouseIndex + 1) * 100000;
        }
      }
    }
    
    // Find all existing codes in numeric format
    const allProducts = await Product.find();
    const usedCodes = new Set(
      allProducts
        .map(p => parseInt(p.code))
        .filter(code => !isNaN(code))
    );
    
    // Find the first available code starting from baseCode
    let nextCode = baseCode;
    const maxCode = baseCode + 100000; // Limit search range
    while (usedCodes.has(nextCode) && nextCode < maxCode) {
      nextCode++;
    }
    
    res.json({ code: String(nextCode) });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Check if code exists
router.get('/check-code/:code', auth, async (req, res) => {
  try {
    const { excludeId } = req.query;
    const query = { code: req.params.code };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const exists = await Product.findOne(query);
    res.json({ exists: !!exists });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Check if product name exists
router.get('/check-name/:name', auth, async (req, res) => {
  try {
    const { excludeId } = req.query;
    const normalizedName = req.params.name.trim();
    const query = { 
      name: { 
        $regex: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') 
      } 
    };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existingProduct = await Product.findOne(query);
    res.json({ 
      exists: !!existingProduct,
      product: existingProduct ? {
        _id: existingProduct._id,
        name: existingProduct.name,
        code: existingProduct.code
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Upload images for product
router.post('/upload-images', auth, authorize('admin'), upload.array('images', 8), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Rasm yuklanmadi' });
    }
    const baseUrl = process.env.BASE_URL || '';
    const imagePaths = req.files.map(file => `${baseUrl}/uploads/products/${file.filename}`);
    res.json({ images: imagePaths });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Delete image
router.delete('/delete-image', auth, authorize('admin'), async (req, res) => {
  try {
    let { imagePath } = req.body;
    if (!imagePath) return res.status(400).json({ message: 'Rasm yo\'li ko\'rsatilmagan' });
    
    // Remove base URL if present to get relative path
    const baseUrl = process.env.BASE_URL || '';
    if (baseUrl && imagePath.startsWith(baseUrl)) {
      imagePath = imagePath.replace(baseUrl, '');
    }
    
    const fullPath = path.join(__dirname, '../..', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    res.json({ message: 'Rasm o\'chirildi' });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Check stock availability for items
router.post('/check-stock', auth, async (req, res) => {
  try {
    const { items } = req.body;
    const errors = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        errors.push({
          name: item.name,
          available: 0,
          requested: item.quantity,
          message: 'Tovar topilmadi'
        });
      } else if (product.quantity < item.quantity) {
        errors.push({
          name: product.name,
          available: product.quantity,
          requested: item.quantity
        });
      }
    }
    
    res.json({ success: errors.length === 0, errors });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('warehouse', 'name');
    if (!product) return res.status(404).json({ message: 'Tovar topilmadi' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    let { warehouse, code, packageInfo, name, price, costPrice, ...rest } = req.body;
    
    // Trim and normalize inputs
    const normalizedName = name ? name.trim() : '';
    const normalizedCode = code ? code.trim() : '';
    
    // Validate required fields
    if (!normalizedName) {
      return res.status(400).json({ 
        message: 'Mahsulot nomi kiritilishi shart',
        field: 'name'
      });
    }
    
    if (!normalizedCode) {
      return res.status(400).json({ 
        message: 'Mahsulot kodi kiritilishi shart',
        field: 'code'
      });
    }
    
    // CRITICAL: Handle warehouse - support both ID and name
    if (warehouse) {
      // Check if warehouse is a name (string) instead of ObjectId
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(warehouse);
      if (!isObjectId) {
        // It's a name, find the warehouse by name
        const warehouseDoc = await Warehouse.findOne({ name: warehouse });
        if (warehouseDoc) {
          warehouse = warehouseDoc._id;
          console.log(`✅ Found warehouse "${warehouseDoc.name}" with ID: ${warehouse}`);
        } else {
          // Warehouse name not found, create it if it's "Asosiy ombor"
          if (warehouse === 'Asosiy ombor') {
            const newWarehouse = await Warehouse.create({
              name: 'Asosiy ombor',
              address: '',
              type: 'main',
              isMain: true
            });
            warehouse = newWarehouse._id;
            console.log(`✅ Created "Asosiy ombor" warehouse with ID: ${warehouse}`);
          } else {
            return res.status(400).json({ 
              message: `Ombor "${warehouse}" topilmadi`,
              field: 'warehouse'
            });
          }
        }
      }
    } else {
      // No warehouse provided, use or create "Asosiy ombor"
      let mainWarehouse = await Warehouse.findOne({ 
        $or: [
          { name: 'Asosiy ombor' },
          { isMain: true }
        ]
      });
      
      if (!mainWarehouse) {
        // Create "Asosiy ombor" if it doesn't exist
        mainWarehouse = await Warehouse.create({
          name: 'Asosiy ombor',
          address: '',
          type: 'main',
          isMain: true
        });
        console.log('✅ Created "Asosiy ombor" warehouse');
      }
      
      warehouse = mainWarehouse._id;
      console.log(`✅ Using "Asosiy ombor" (${warehouse}) for new product`);
    }
    
    // CRITICAL: Check for duplicates BEFORE attempting to save
    
    // 1. Check by CODE (must be unique)
    const existingByCode = await Product.findOne({ 
      code: normalizedCode
    });
    
    if (existingByCode) {
      return res.status(409).json({ // 409 = Conflict
        message: `Kod "${normalizedCode}" allaqachon mavjud!`,
        field: 'code',
        existingProduct: {
          _id: existingByCode._id,
          name: existingByCode.name,
          code: existingByCode.code,
          price: existingByCode.price,
          costPrice: existingByCode.costPrice,
          quantity: existingByCode.quantity
        }
      });
    }
    
    // 2. Check for EXACT duplicate (same name, price, and costPrice)
    const exactDuplicate = await Product.findOne({ 
      name: { $regex: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      price: price,
      costPrice: costPrice || 0
    });
    
    if (exactDuplicate) {
      return res.status(409).json({ // 409 = Conflict
        message: `Aynan bir xil mahsulot allaqachon mavjud!\nNom: "${normalizedName}"\nNarx: ${price} so'm\nTan narxi: ${costPrice || 0} so'm`,
        field: 'duplicate',
        isDuplicateProduct: true,
        existingProduct: {
          _id: exactDuplicate._id,
          name: exactDuplicate.name,
          code: exactDuplicate.code,
          price: exactDuplicate.price,
          costPrice: exactDuplicate.costPrice,
          quantity: exactDuplicate.quantity
        }
      });
    }
    
    // 3. Check by NAME only (warning, but allow if price is different)
    const existingByName = await Product.findOne({ 
      name: { $regex: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });
    
    if (existingByName) {
      // Same name but different price - this is allowed
      console.log(`⚠️  Warning: Product with same name exists but different price`);
      console.log(`   Existing: ${existingByName.name} - ${existingByName.price} so'm`);
      console.log(`   New: ${normalizedName} - ${price} so'm`);
      // Continue to create the product
    }
    
    // Auto-generate code if needed
    let productCode = normalizedCode;
    
    // Determine the starting code based on warehouse
    let baseCode = 1;
    if (warehouse) {
      const warehouseDoc = await Warehouse.findById(warehouse);
      if (warehouseDoc && warehouseDoc.name !== 'Asosiy ombor') {
        const allWarehouses = await Warehouse.find().sort({ createdAt: 1 });
        const nonMainWarehouses = allWarehouses.filter(w => w.name !== 'Asosiy ombor');
        const warehouseIndex = nonMainWarehouses.findIndex(w => w._id.toString() === warehouse);
        if (warehouseIndex >= 0) {
          baseCode = (warehouseIndex + 1) * 100000;
        }
      }
    }
    
    // Find all existing codes in numeric format
    const allProducts = await Product.find();
    const usedCodes = new Set(
      allProducts
        .map(p => parseInt(p.code))
        .filter(code => !isNaN(code))
    );
    
    // If code is provided, check if it exists
    if (productCode) {
      const codeNum = parseInt(productCode);
      if (!isNaN(codeNum) && usedCodes.has(codeNum)) {
        // Code is taken, find first available starting from 1
        let nextCode = 1;
        const maxCode = 1000000;
        while (usedCodes.has(nextCode) && nextCode < maxCode) {
          nextCode++;
        }
        productCode = String(nextCode);
      }
    } else {
      // No code provided, find the first available code starting from baseCode
      let nextCode = baseCode;
      const maxCode = baseCode + 100000;
      while (usedCodes.has(nextCode) && nextCode < maxCode) {
        nextCode++;
      }
      productCode = String(nextCode);
    }
    
    // Check if warehouse is "Asosiy ombor"
    let isMainWarehouse = false;
    if (warehouse) {
      const warehouseDoc = await Warehouse.findById(warehouse);
      if (warehouseDoc && warehouseDoc.name === 'Asosiy ombor') {
        isMainWarehouse = true;
      }
    }
    
    // Prepare product data with normalized values
    const productData = { 
      ...rest,
      name: normalizedName,
      code: productCode,
      price: price,
      costPrice: costPrice || 0,
      warehouse,
      isMainWarehouse,
      createdBy: req.user._id 
    };
    
    // Add package information if provided
    if (packageInfo) {
      productData.packages = [packageInfo];
    }
    
    // Create and save product
    const product = new Product(productData);
    await product.save();
    
    // CRITICAL: Create WarehouseInventory for the product
    try {
      await WarehouseInventory.create({
        product: product._id,
        warehouse: warehouse,
        quantity: productData.quantity || 0,
        minStock: productData.minStock || 5
      });
      console.log(`✅ Created inventory for product: ${product.code} - ${product.name}`);
    } catch (invError) {
      console.error(`⚠️  Failed to create inventory for product ${product.code}:`, invError.message);
      // Don't fail the whole request if inventory creation fails
    }
    
    res.status(201).json(product);
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(409).json({ 
        message: `Bu ${field === 'code' ? 'kod' : 'nom'} "${value}" allaqachon mavjud!`,
        field: field,
        error: 'DUPLICATE_KEY'
      });
    }
    
    console.error('Product creation error:', error);
    res.status(500).json({ 
      message: 'Server xatosi', 
      error: error.message 
    });
  }
});

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { warehouse, code, packageInfo, name, quantity, ...rest } = req.body;
    
    // Trim and normalize the name
    const normalizedName = name ? name.trim() : undefined;
    
    // Check if product name already exists (excluding current product)
    if (normalizedName) {
      const existingByName = await Product.findOne({ 
        name: { $regex: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingByName) {
        return res.status(400).json({ 
          message: `"${normalizedName}" nomli mahsulot allaqachon mavjud. Iltimos, boshqa nom kiriting.`,
          field: 'name',
          existingProduct: {
            _id: existingByName._id,
            name: existingByName.name,
            code: existingByName.code
          }
        });
      }
    }
    
    // Check if code already exists (excluding current product)
    if (code) {
      const existingProduct = await Product.findOne({ code, _id: { $ne: req.params.id } });
      if (existingProduct) {
        return res.status(400).json({ message: `Kod "${code}" allaqachon mavjud` });
      }
    }
    
    // Check if warehouse is "Asosiy ombor"
    let isMainWarehouse = false;
    if (warehouse) {
      const warehouseDoc = await Warehouse.findById(warehouse);
      if (warehouseDoc && warehouseDoc.name === 'Asosiy ombor') {
        isMainWarehouse = true;
      }
    }
    
    // Prepare update data with normalized name
    const updateData = { 
      ...rest, 
      ...(normalizedName && { name: normalizedName }),
      code, 
      warehouse, 
      isMainWarehouse,
      ...(quantity !== undefined && { quantity: Number(quantity) })
    };
    
    // Add package information if provided
    if (packageInfo) {
      const product = await Product.findById(req.params.id);
      if (product) {
        updateData.packages = [...(product.packages || []), packageInfo];
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Tovar topilmadi' });
    
    // CRITICAL: Update WarehouseInventory if quantity changed
    if (quantity !== undefined && warehouse) {
      try {
        const inventory = await WarehouseInventory.findOne({
          product: req.params.id,
          warehouse: warehouse
        });
        
        if (inventory) {
          inventory.quantity = Number(quantity);
          await inventory.save();
          console.log(`✅ Updated inventory for product ${product.code}: ${quantity}`);
        } else {
          // Create inventory if it doesn't exist
          await WarehouseInventory.create({
            product: req.params.id,
            warehouse: warehouse,
            quantity: Number(quantity),
            minStock: product.minStock || 5
          });
          console.log(`✅ Created inventory for product ${product.code}: ${quantity}`);
        }
      } catch (invError) {
        console.error(`⚠️  Failed to update inventory for product ${product.code}:`, invError.message);
      }
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Tovar topilmadi' });
    res.json({ message: 'Tovar o\'chirildi' });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

module.exports = router;
