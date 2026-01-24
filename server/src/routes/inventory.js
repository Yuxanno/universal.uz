const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const WarehouseInventory = require('../models/WarehouseInventory');
const WarehouseTransfer = require('../models/WarehouseTransfer');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');

// Get inventory for a specific warehouse
router.get('/warehouse/:warehouseId', auth, async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { search, lowStock } = req.query;

    let query = { warehouse: warehouseId };

    const inventory = await WarehouseInventory.find(query)
      .populate('product')
      .populate('warehouse');

    // Filter out items where product was deleted
    let filtered = inventory.filter(item => item.product !== null);

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.product.name.toLowerCase().includes(searchLower) ||
        item.product.code.toLowerCase().includes(searchLower)
      );
    }

    // Filter by low stock
    if (lowStock === 'true') {
      filtered = filtered.filter(item => 
        item.quantity > 0 && item.quantity <= item.minStock
      );
    }

    // Sort by product code (numeric) - DESCENDING (1023 -> 1)
    filtered.sort((a, b) => {
      const codeA = parseInt(a.product.code) || 0;
      const codeB = parseInt(b.product.code) || 0;
      return codeB - codeA; // Reversed for descending order
    });

    res.json(filtered);
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// Get inventory for a specific product across all warehouses
router.get('/product/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const inventory = await WarehouseInventory.find({ product: productId })
      .populate('warehouse')
      .sort({ 'warehouse.name': 1 });

    res.json(inventory);
  } catch (err) {
    console.error('Error fetching product inventory:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// Transfer product between warehouses
router.post('/transfer', auth, async (req, res) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;

    // ============================================
    // 1. VALIDATION
    // ============================================
    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return res.status(400).json({ message: 'Barcha maydonlarni to\'ldiring' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Miqdor 0 dan katta bo\'lishi kerak' });
    }

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ message: 'Bir xil omborga o\'tkazish mumkin emas' });
    }

    // ============================================
    // 2. CHECK EXISTENCE
    // ============================================
    const [fromWarehouse, toWarehouse, product] = await Promise.all([
      Warehouse.findById(fromWarehouseId),
      Warehouse.findById(toWarehouseId),
      Product.findById(productId)
    ]);

    if (!fromWarehouse) {
      return res.status(404).json({ message: 'Manba ombor topilmadi' });
    }

    if (!toWarehouse) {
      return res.status(404).json({ message: 'Maqsad ombor topilmadi' });
    }

    if (!product) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }

    // ============================================
    // 3. DETERMINE TRANSFER TYPE
    // ============================================
    let transferType = 'internal';
    if (fromWarehouse.isMain && !toWarehouse.isMain) {
      transferType = 'export'; // EXPORT: Main → Sub
    } else if (!fromWarehouse.isMain && toWarehouse.isMain) {
      transferType = 'import'; // IMPORT: Sub → Main
    }

    console.log(`\n🔄 TRANSFER START: ${transferType.toUpperCase()}`);
    console.log(`📦 Product: ${product.name} (${product.code})`);
    console.log(`📤 From: ${fromWarehouse.name} (${fromWarehouse.isMain ? 'MAIN' : 'SUB'})`);
    console.log(`📥 To: ${toWarehouse.name} (${toWarehouse.isMain ? 'MAIN' : 'SUB'})`);
    console.log(`🔢 Quantity: ${quantity}`);

    // ============================================
    // 4. CHECK SOURCE INVENTORY
    // ============================================
    const sourceInventory = await WarehouseInventory.findOne({
      product: productId,
      warehouse: fromWarehouseId
    });

    if (!sourceInventory) {
      console.log(`❌ ERROR: Product not found in source warehouse`);
      return res.status(400).json({ 
        message: `"${product.name}" mahsuloti "${fromWarehouse.name}" omborida mavjud emas`,
        transferType
      });
    }

    console.log(`📊 Source inventory BEFORE: ${sourceInventory.quantity}`);

    if (sourceInventory.quantity < quantity) {
      console.log(`❌ ERROR: Insufficient quantity. Available: ${sourceInventory.quantity}, Requested: ${quantity}`);
      return res.status(400).json({ 
        message: `Yetarli miqdor yo'q. Mavjud: ${sourceInventory.quantity}, Talab: ${quantity}`,
        available: sourceInventory.quantity,
        requested: quantity,
        transferType
      });
    }

    // ============================================
    // 5. PERFORM TRANSFER
    // ============================================
    
    // 5.1. DECREASE FROM SOURCE
    const oldSourceQuantity = sourceInventory.quantity;
    sourceInventory.quantity -= quantity;
    console.log(`📊 Source inventory AFTER: ${sourceInventory.quantity}`);
    
    if (sourceInventory.quantity <= 0) {
      // Delete inventory record if quantity becomes 0
      await WarehouseInventory.deleteOne({ _id: sourceInventory._id });
      console.log(`🗑️  Source inventory DELETED (quantity = 0)`);
    } else {
      await sourceInventory.save();
      console.log(`💾 Source inventory SAVED`);
    }

    // 5.2. INCREASE IN DESTINATION
    let destInventory = await WarehouseInventory.findOne({
      product: productId,
      warehouse: toWarehouseId
    });

    const oldDestQuantity = destInventory ? destInventory.quantity : 0;

    if (destInventory) {
      console.log(`📊 Destination inventory BEFORE: ${destInventory.quantity}`);
      destInventory.quantity += quantity;
      await destInventory.save();
      console.log(`📊 Destination inventory AFTER: ${destInventory.quantity}`);
      console.log(`💾 Destination inventory UPDATED`);
    } else {
      destInventory = await WarehouseInventory.create({
        product: productId,
        warehouse: toWarehouseId,
        quantity: quantity,
        minStock: sourceInventory.minStock || 5
      });
      console.log(`📊 Destination inventory CREATED: ${destInventory.quantity}`);
    }

    // ============================================
    // 6. LOG THE TRANSFER
    // ============================================
    const transfer = await WarehouseTransfer.create({
      product: productId,
      fromWarehouse: fromWarehouseId,
      toWarehouse: toWarehouseId,
      quantity: quantity,
      type: transferType,
      transferredBy: req.user.id,
      notes: notes || '',
      status: 'completed'
    });

    console.log(`📝 Transfer logged: ${transfer._id}`);
    console.log(`✅ TRANSFER COMPLETED SUCCESSFULLY\n`);

    // Populate for response
    await transfer.populate(['product', 'fromWarehouse', 'toWarehouse', 'transferredBy']);

    res.json({
      success: true,
      message: `${transferType === 'export' ? 'EXPORT' : transferType === 'import' ? 'IMPORT' : 'Transfer'} muvaffaqiyatli amalga oshirildi`,
      transfer: transfer,
      transferType,
      sourceQuantityBefore: oldSourceQuantity,
      sourceQuantityAfter: sourceInventory.quantity,
      destQuantityBefore: oldDestQuantity,
      destQuantityAfter: destInventory.quantity
    });

  } catch (err) {
    console.error('❌ TRANSFER ERROR:', err);
    res.status(500).json({ message: 'Transfer xatosi: ' + err.message });
  }
});

// Get transfer history
router.get('/transfers', auth, async (req, res) => {
  try {
    const { productId, warehouseId, startDate, endDate, type, limit = 50 } = req.query;

    let query = {};

    if (productId) {
      query.product = productId;
    }

    if (warehouseId) {
      query.$or = [
        { fromWarehouse: warehouseId },
        { toWarehouse: warehouseId }
      ];
    }

    if (type && ['export', 'import', 'internal'].includes(type)) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transfers = await WarehouseTransfer.find(query)
      .populate('product')
      .populate('fromWarehouse')
      .populate('toWarehouse')
      .populate('transferredBy', 'name username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(transfers);
  } catch (err) {
    console.error('Error fetching transfers:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// Get transfer statistics
router.get('/transfers/stats', auth, async (req, res) => {
  try {
    const { warehouseId, startDate, endDate } = req.query;

    let matchQuery = { status: 'completed' };

    if (warehouseId) {
      matchQuery.$or = [
        { fromWarehouse: warehouseId },
        { toWarehouse: warehouseId }
      ];
    }

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = await WarehouseTransfer.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    const result = {
      totalTransfers: 0,
      totalQuantity: 0,
      exports: { count: 0, quantity: 0 },
      imports: { count: 0, quantity: 0 },
      internal: { count: 0, quantity: 0 }
    };

    stats.forEach(stat => {
      result.totalTransfers += stat.count;
      result.totalQuantity += stat.totalQuantity;
      
      if (stat._id === 'export') {
        result.exports = { count: stat.count, quantity: stat.totalQuantity };
      } else if (stat._id === 'import') {
        result.imports = { count: stat.count, quantity: stat.totalQuantity };
      } else if (stat._id === 'internal') {
        result.internal = { count: stat.count, quantity: stat.totalQuantity };
      }
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching transfer stats:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// Add or update inventory for a warehouse
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, warehouseId, quantity } = req.body;

    if (!productId || !warehouseId || quantity === undefined) {
      return res.status(400).json({ message: 'Barcha maydonlarni to\'ldiring' });
    }

    // Check if product and warehouse exist
    const [product, warehouse] = await Promise.all([
      Product.findById(productId),
      Warehouse.findById(warehouseId)
    ]);

    if (!product) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }

    if (!warehouse) {
      return res.status(404).json({ message: 'Ombor topilmadi' });
    }

    // Find or create inventory
    let inventory = await WarehouseInventory.findOne({
      product: productId,
      warehouse: warehouseId
    });

    if (inventory) {
      inventory.quantity = quantity;
      await inventory.save();
    } else {
      inventory = await WarehouseInventory.create({
        product: productId,
        warehouse: warehouseId,
        quantity: quantity
      });
    }

    await inventory.populate(['product', 'warehouse']);

    res.json(inventory);
  } catch (err) {
    console.error('Error adding inventory:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// Undo/Cancel a transfer (delete from history and reverse inventory)
router.post('/transfers/:transferId/undo', auth, async (req, res) => {
  try {
    const { transferId } = req.params;

    // ============================================
    // 1. FIND THE TRANSFER
    // ============================================
    const transfer = await WarehouseTransfer.findById(transferId)
      .populate('product')
      .populate('fromWarehouse')
      .populate('toWarehouse');

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer topilmadi' });
    }

    console.log(`\n🔙 UNDO TRANSFER START`);
    console.log(`📦 Product: ${transfer.product.name}`);
    console.log(`📤 Original: ${transfer.fromWarehouse.name} → ${transfer.toWarehouse.name}`);
    console.log(`🔢 Quantity: ${transfer.quantity}`);

    // ============================================
    // 2. CHECK TIME LIMIT (30 minutes)
    // ============================================
    const transferTime = new Date(transfer.createdAt).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - transferTime) / (1000 * 60);
    
    if (diffMinutes > 30) {
      console.log(`❌ ERROR: Transfer too old (${Math.round(diffMinutes)} minutes)`);
      return res.status(400).json({ 
        message: 'Bu transfer 30 daqiqadan ko\'proq vaqt o\'tgan. Xavfsizlik uchun eski transferlarni bekor qilib bo\'lmaydi.'
      });
    }

    // ============================================
    // 3. REVERSE INVENTORY CHANGES
    // ============================================
    
    // 3.1. ADD BACK TO SOURCE WAREHOUSE
    let sourceInventory = await WarehouseInventory.findOne({
      product: transfer.product._id,
      warehouse: transfer.fromWarehouse._id
    });

    if (sourceInventory) {
      console.log(`📊 Source inventory BEFORE: ${sourceInventory.quantity}`);
      sourceInventory.quantity += transfer.quantity;
      await sourceInventory.save();
      console.log(`📊 Source inventory AFTER: ${sourceInventory.quantity}`);
    } else {
      // Create if doesn't exist
      sourceInventory = await WarehouseInventory.create({
        product: transfer.product._id,
        warehouse: transfer.fromWarehouse._id,
        quantity: transfer.quantity
      });
      console.log(`📊 Source inventory CREATED: ${transfer.quantity}`);
    }

    // 3.2. REMOVE FROM DESTINATION WAREHOUSE
    const destInventory = await WarehouseInventory.findOne({
      product: transfer.product._id,
      warehouse: transfer.toWarehouse._id
    });

    if (destInventory) {
      console.log(`📊 Destination inventory BEFORE: ${destInventory.quantity}`);
      destInventory.quantity -= transfer.quantity;
      
      // If quantity becomes 0 or negative, delete the inventory record
      if (destInventory.quantity <= 0) {
        await WarehouseInventory.deleteOne({ _id: destInventory._id });
        console.log(`🗑️  Destination inventory DELETED (quantity = 0)`);
      } else {
        await destInventory.save();
        console.log(`📊 Destination inventory AFTER: ${destInventory.quantity}`);
      }
    } else {
      console.log(`⚠️  WARNING: Destination inventory not found (already deleted?)`);
    }

    // ============================================
    // 4. DELETE THE TRANSFER FROM HISTORY
    // ============================================
    await WarehouseTransfer.deleteOne({ _id: transferId });
    console.log(`🗑️  Transfer DELETED from history`);

    console.log(`✅ UNDO COMPLETED SUCCESSFULLY\n`);

    res.json({
      success: true,
      message: `Transfer bekor qilindi. ${transfer.product.name} (${transfer.quantity} dona) "${transfer.fromWarehouse.name}" omboriga qaytarildi.`,
      transfer: {
        product: transfer.product.name,
        quantity: transfer.quantity,
        from: transfer.fromWarehouse.name,
        to: transfer.toWarehouse.name
      }
    });

  } catch (err) {
    console.error('❌ UNDO ERROR:', err);
    res.status(500).json({ message: 'Bekor qilish xatosi: ' + err.message });
  }
});

// Migrate all products to inventory system
router.post('/migrate', auth, authorize('admin'), async (req, res) => {
  try {
    // Step 1: Find or create main warehouse
    let mainWarehouse = await Warehouse.findOne({ 
      $or: [
        { name: 'Asosiy ombor' },
        { isMain: true }
      ]
    });

    if (!mainWarehouse) {
      mainWarehouse = await Warehouse.create({
        name: 'Asosiy ombor',
        address: '',
        type: 'main',
        isMain: true
      });
    } else {
      // Ensure it's marked as main
      if (!mainWarehouse.isMain) {
        mainWarehouse.isMain = true;
        mainWarehouse.type = 'main';
        await mainWarehouse.save();
      }
    }

    // Step 2: Get all products
    const products = await Product.find({});

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    // Step 3: Create inventory records for each product
    for (const product of products) {
      try {
        // Check if inventory record already exists
        const existingInventory = await WarehouseInventory.findOne({
          product: product._id,
          warehouse: mainWarehouse._id
        });

        if (existingInventory) {
          // Update quantity if different
          if (existingInventory.quantity !== product.quantity) {
            existingInventory.quantity = product.quantity;
            await existingInventory.save();
            updated++;
          } else {
            skipped++;
          }
        } else {
          // Create new inventory record
          await WarehouseInventory.create({
            product: product._id,
            warehouse: mainWarehouse._id,
            quantity: product.quantity || 0,
            minStock: product.minStock || 5
          });
          created++;
        }

        // Update product's warehouse reference if not set
        if (!product.warehouse || product.warehouse.toString() !== mainWarehouse._id.toString()) {
          product.warehouse = mainWarehouse._id;
          product.isMainWarehouse = true;
          await product.save();
        }

      } catch (err) {
        errors.push({ product: product.name, error: err.message });
      }
    }

    res.json({
      success: true,
      message: 'Migration muvaffaqiyatli yakunlandi',
      stats: {
        total: products.length,
        created,
        updated,
        skipped,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ message: 'Migration xatosi: ' + err.message });
  }
});

module.exports = router;
