const express = require('express');
const Receipt = require('../models/Receipt');
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');
const inventoryRoutes = require('./inventory');
const clearInventoryCache = inventoryRoutes.clearInventoryCache;

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { status, startDate, endDate, isReturn, limit } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    
    // Filter by isReturn
    if (isReturn !== undefined) {
      query.isReturn = isReturn === 'true' || isReturn === true;
    }
    
    // Date filter for today's sales
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lt: new Date(endDate)
      };
    }
    
    // Parse limit (default 50 for performance)
    const limitNum = limit ? parseInt(limit) : 50;
    
    const receipts = await Receipt.find(query)
      .populate('customer', 'name') // Only name, not phone
      .select('items total paymentMethod customer createdAt status isReturn') // Only needed fields
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean(); // Use lean() for faster queries
    
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Get or create draft receipt for helper
router.get('/draft', auth, authorize('helper'), async (req, res) => {
  try {
    const { draftId } = req.query;
    
    // If draftId provided, try to find that specific draft
    if (draftId) {
      const receipt = await Receipt.findOne({ 
        _id: draftId,
        createdBy: req.user._id, 
        status: 'draft' 
      });
      
      if (receipt) {
        return res.json(receipt);
      }
    }
    
    // Don't create new draft automatically - let frontend create it when needed
    // Return null to indicate no draft exists
    res.json(null);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Check if draft has been updated (lightweight endpoint)
router.get('/draft/check', auth, authorize('helper'), async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ 
      createdBy: req.user._id, 
      status: { $in: ['draft', 'pending'] }
    }).select('updatedAt status');
    
    if (!receipt) {
      return res.json({ exists: false });
    }
    
    res.json({ 
      exists: true, 
      updatedAt: receipt.updatedAt,
      status: receipt.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Update draft receipt (add/remove items) - only for draft status
router.put('/draft', auth, authorize('helper'), async (req, res) => {
  try {
    const { items, customer, draftId, status } = req.body;
    
    let draft;
    
    // If draftId provided, find that specific draft or archived receipt
    if (draftId) {
      draft = await Receipt.findOne({ 
        _id: draftId,
        createdBy: req.user._id, 
        status: { $in: ['draft', 'archived'] } // Allow updating both draft and archived
      });
    }
    
    // If no draft found, create new one
    if (!draft) {
      draft = new Receipt({
        items: [],
        total: 0,
        status: status || 'draft', // Default to draft (working state)
        createdBy: req.user._id
      });
    }
    
    draft.items = items;
    draft.total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (customer !== undefined) {
      draft.customer = customer;
    }
    // Update status if provided
    if (status) {
      draft.status = status;
    }
    await draft.save();
    
    // Emit socket event for real-time updates
    if (global.io) {
      console.log('📡 [Socket] Emitting receipt:updated event:', {
        receiptId: draft._id,
        status: draft.status,
        itemsCount: draft.items.length,
        total: draft.total
      });
      global.io.emit('receipt:updated', {
        receiptId: draft._id,
        status: draft.status,
        items: draft.items,
        total: draft.total,
        customer: draft.customer,
        createdBy: draft.createdBy
      });
    }
    
    res.json(draft);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Submit draft (change status to pending)
// Submit draft (send to cashier or save to archive)
router.put('/draft/submit', auth, authorize('helper'), async (req, res) => {
  try {
    const { sendToArchive, draftId } = req.body;
    
    let draft;
    
    // If draftId provided, find that specific draft
    if (draftId) {
      draft = await Receipt.findOne({ 
        _id: draftId,
        createdBy: req.user._id, 
        status: 'draft' 
      });
    }
    
    if (!draft) {
      return res.status(404).json({ message: 'Draft topilmadi' });
    }
    
    if (draft.items.length === 0) {
      return res.status(400).json({ message: 'Savat bo\'sh' });
    }
    
    // If sendToArchive is true, save to archive only (helper's private archive)
    // If false, send to cashier (pending)
    if (sendToArchive) {
      draft.status = 'archived';
    } else {
      draft.status = 'pending'; // Send to cashier
    }
    
    await draft.save();
    
    res.json(draft);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.get('/staff', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const { status } = req.query;
    // YANGI: Show draft, pending, AND archived receipts
    const query = { 
      status: { $in: ['draft', 'pending', 'archived'] },
      // Only show receipts with items (not empty)
      'items.0': { $exists: true }
    };
    if (status && status !== 'all' && ['draft', 'pending', 'archived'].includes(status)) {
      query.status = status;
    }
    
    const receipts = await Receipt.find(query)
      .populate('createdBy', 'name role')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Get archived receipts
router.get('/archived', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const receipts = await Receipt.find({ status: 'archived' })
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Get helper's own archived receipts (ONLY archived, sent_to_kassa, and pending status, NOT draft)
router.get('/my-archived', auth, authorize('helper'), async (req, res) => {
  try {
    console.log('📦 [my-archived] Request from user:', {
      userId: req.user._id,
      userName: req.user.name,
      role: req.user.role
    });
    
    const receipts = await Receipt.find({ 
      status: { $in: ['archived', 'sent_to_kassa', 'pending'] }, // YANGI: pending ham qo'shildi
      createdBy: req.user._id,
      // Only show receipts with items (not empty)
      'items.0': { $exists: true }
    })
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 });
    
    console.log('📦 [my-archived] Found receipts:', {
      count: receipts.length,
      receipts: receipts.map(r => ({
        id: r._id,
        status: r.status,
        itemsCount: r.items.length,
        createdBy: r.createdBy
      }))
    });
    
    res.json(receipts);
  } catch (error) {
    console.error('❌ [my-archived] Error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Load worker receipt to kassa (complete it and remove from archive)
router.put('/:id/load-to-kassa', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      console.error('❌ Receipt not found:', req.params.id);
      return res.status(404).json({ message: 'Chek topilmadi' });
    }
    
    console.log('📦 Loading receipt to kassa:', {
      id: receipt._id,
      status: receipt.status,
      itemsCount: receipt.items.length
    });
    
    // Allow loading from pending, approved, or archived status
    if (!['pending', 'approved', 'archived'].includes(receipt.status)) {
      console.error('❌ Invalid status:', receipt.status);
      return res.status(400).json({ message: 'Bu chek allaqachon yuklangan' });
    }

    // Check stock availability
    const WarehouseInventory = require('../models/WarehouseInventory');
    
    for (const item of receipt.items) {
      console.log('🔍 Checking product:', item.product, item.name);
      
      const product = await Product.findById(item.product);
      if (!product) {
        console.error('❌ Product not found:', item.product, item.name);
        return res.status(400).json({ message: `Tovar topilmadi: ${item.name}` });
      }
      
      // Check inventory instead of product.quantity
      const inventory = await WarehouseInventory.findOne({ product: item.product });
      const availableQty = inventory ? inventory.quantity : 0;
      
      console.log('📊 Stock check:', {
        product: item.name,
        available: availableQty,
        requested: item.quantity
      });
      
      if (availableQty < item.quantity) {
        console.error('❌ Insufficient stock:', {
          product: item.name,
          available: availableQty,
          requested: item.quantity
        });
        return res.status(400).json({ 
          message: `Yetarli tovar yo'q: ${item.name}. Mavjud: ${availableQty}, So'ralgan: ${item.quantity}` 
        });
      }
    }

    // Update stock and soldCount
    console.log('✅ All checks passed, updating inventory...');
    
    for (const item of receipt.items) {
      // Update product soldCount
      await Product.findByIdAndUpdate(item.product, { 
        $inc: { soldCount: item.quantity } 
      });
      
      // Update warehouse inventory quantity
      const inventory = await WarehouseInventory.findOne({ product: item.product });
      if (inventory) {
        inventory.quantity -= item.quantity;
        await inventory.save();
        console.log('✅ Updated inventory:', {
          product: item.name,
          newQuantity: inventory.quantity
        });
      } else {
        console.warn('⚠️ Inventory not found for product:', item.product, item.name);
      }
    }

    // YANGI: Arxivga tushirish (status = 'archived')
    receipt.status = 'archived';
    receipt.processedBy = req.user._id;
    await receipt.save();
    
    console.log('✅ Receipt archived after loading to kassa:', receipt._id);
    
    // OPTIMIZED: Don't clear cache - Socket event handles updates
    // clearInventoryCache(); // REMOVED
    
    res.json(receipt);
  } catch (error) {
    console.error('❌ Error in load-to-kassa:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Update receipt status (for resending archived receipts)
router.put('/:id/status', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'pending', 'approved', 'archived', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Noto\'g\'ri status' });
    }
    
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ message: 'Chek topilmadi' });
    }
    
    receipt.status = status;
    await receipt.save();
    
    console.log('✅ Receipt status updated:', {
      id: receipt._id,
      newStatus: status
    });
    
    res.json(receipt);
  } catch (error) {
    console.error('❌ Error updating receipt status:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Remove item from receipt
router.put('/:id/remove-item/:itemIndex', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Chek topilmadi' });
    if (receipt.status === 'completed') {
      return res.status(400).json({ message: 'Yakunlangan chekni o\'zgartirish mumkin emas' });
    }

    const itemIndex = parseInt(req.params.itemIndex);
    if (itemIndex < 0 || itemIndex >= receipt.items.length) {
      return res.status(400).json({ message: 'Noto\'g\'ri tovar indeksi' });
    }

    receipt.items.splice(itemIndex, 1);
    receipt.total = receipt.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // If no items left, delete the receipt
    if (receipt.items.length === 0) {
      await Receipt.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Chek o\'chirildi', deleted: true });
    }
    
    await receipt.save();
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Update item in receipt (price or quantity)
router.put('/:id/update-item/:itemIndex', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Chek topilmadi' });
    if (receipt.status === 'completed') {
      return res.status(400).json({ message: 'Yakunlangan chekni o\'zgartirish mumkin emas' });
    }

    const itemIndex = parseInt(req.params.itemIndex);
    if (itemIndex < 0 || itemIndex >= receipt.items.length) {
      return res.status(400).json({ message: 'Noto\'g\'ri tovar indeksi' });
    }

    const { price, quantity } = req.body;
    
    if (price !== undefined) {
      receipt.items[itemIndex].price = price;
    }
    if (quantity !== undefined) {
      if (quantity <= 0) {
        // Remove item if quantity is 0
        receipt.items.splice(itemIndex, 1);
      } else {
        receipt.items[itemIndex].quantity = quantity;
      }
    }
    
    receipt.total = receipt.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    if (receipt.items.length === 0) {
      await Receipt.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Chek o\'chirildi', deleted: true });
    }
    
    await receipt.save();
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

/**
 * Bulk sync endpoint for offline sales
 * Receives array of sales from offline POS
 * IMPORTANT: This endpoint must be idempotent - handle duplicate offlineIds
 */
router.post('/bulk', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const { sales } = req.body;
    
    if (!sales || !Array.isArray(sales) || sales.length === 0) {
      return res.status(400).json({ success: false, message: 'No sales provided' });
    }

    const results = [];
    const errors = [];

    for (const sale of sales) {
      try {
        // Check if this offline sale was already synced (by offlineId in metadata)
        const existingReceipt = await Receipt.findOne({ 'metadata.offlineId': sale.offlineId });
        if (existingReceipt) {
          // Already synced, skip but mark as success
          results.push({ offlineId: sale.offlineId, status: 'already_synced' });
          continue;
        }

        // Create receipt from offline sale
        const receipt = new Receipt({
          items: sale.items,
          total: sale.total,
          paymentMethod: sale.paymentMethod || 'cash',
          customer: sale.customer,
          status: 'completed',
          isReturn: sale.isReturn || false,
          createdBy: req.user._id,
          createdAt: sale.createdAt ? new Date(sale.createdAt) : new Date(),
          metadata: { offlineId: sale.offlineId, syncedAt: new Date() }
        });

        // Update product quantities (skip stock check for offline sales)
        for (const item of sale.items) {
          const quantityChange = sale.isReturn ? item.quantity : -item.quantity;
          await Product.findByIdAndUpdate(item.product, { $inc: { quantity: quantityChange } });
        }

        await receipt.save();
        results.push({ offlineId: sale.offlineId, status: 'synced', receiptId: receipt._id });

      } catch (itemError) {
        errors.push({ offlineId: sale.offlineId, error: itemError.message });
      }
    }

    // Return success even if some items failed - client will retry failed ones
    res.json({
      success: true,
      synced: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi', error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { items, total, paymentMethod, customer, isReturn, cashAmount, cardAmount, debtAmount, description } = req.body;
    const isHelper = req.user.role === 'helper';
    
    // Check stock availability before sale (not for returns)
    if (!isReturn && !isHelper) {
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({ message: `Tovar topilmadi: ${item.name}` });
        }
        if (product.quantity < item.quantity) {
          return res.status(400).json({ 
            message: `Yetarli tovar yo'q: ${item.name}. Mavjud: ${product.quantity}, So'ralgan: ${item.quantity}` 
          });
        }
      }
    }
    
    const receipt = new Receipt({
      items,
      total,
      paymentMethod,
      cashAmount: cashAmount || 0,
      cardAmount: cardAmount || 0,
      debtAmount: debtAmount || 0,
      customer,
      status: isHelper ? 'pending' : 'completed',
      isReturn: isReturn || false,
      description: description || null, // Add description field
      createdBy: req.user._id
    });
    
    if (!isHelper) {
      const WarehouseInventory = require('../models/WarehouseInventory');
      
      for (const item of items) {
        // If return mode, add to stock; otherwise subtract
        const quantityChange = isReturn ? item.quantity : -item.quantity;
        
        // Update Product model (legacy)
        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: quantityChange } });
        
        // Update WarehouseInventory (new system)
        // Find the inventory record for this product in the main warehouse
        const inventory = await WarehouseInventory.findOne({ product: item.product });
        if (inventory) {
          inventory.quantity += quantityChange;
          await inventory.save();
          console.log(`📦 Updated inventory for product ${item.product}: ${quantityChange > 0 ? '+' : ''}${quantityChange}`);
        } else {
          console.warn(`⚠️ No inventory record found for product ${item.product}`);
        }
      }
    }
    
    await receipt.save();
    
    // Create or update debt if there's unpaid amount
    if (customer && debtAmount && debtAmount > 0 && !isReturn) {
      const Debt = require('../models/Debt');
      const Customer = require('../models/Customer');
      
      try {
        // Get customer info
        const customerDoc = await Customer.findById(customer);
        if (!customerDoc) {
          console.error('❌ Customer not found for debt creation:', customer);
          throw new Error('Mijoz topilmadi');
        }
        const customerName = customerDoc.name || 'Mijoz';
        
        // Format date as DD.MM.YYYY HH:MM
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const dateStr = `${day}.${month}.${year} ${hours}:${minutes}`;
      
      // Build items description
      const itemsDesc = items.map(item => 
        `${item.name} (${item.quantity} ta × ${item.price.toLocaleString('uz-UZ')} so'm)`
      ).join(', ');
      
      // Build payment info
      const paymentInfo = [];
      if (cashAmount > 0) paymentInfo.push(`naqd ${cashAmount.toLocaleString('uz-UZ')} so'm`);
      if (cardAmount > 0) paymentInfo.push(`karta ${cardAmount.toLocaleString('uz-UZ')} so'm`);
      const paymentStr = paymentInfo.length > 0 ? paymentInfo.join(' va ') : 'to\'lanmagan';
      
      // Create new transaction description
      const transactionDesc = `${dateStr} sanada ${customerName} quyidagi mahsulotlarni sotib oldi: ${itemsDesc}. Jami summa: ${total.toLocaleString('uz-UZ')} so'm. To'langan: ${paymentStr}. Qarzga qolgan: ${debtAmount.toLocaleString('uz-UZ')} so'm.`;
      
      // Always create a NEW debt for each receipt (don't combine with existing debts)
      const debt = new Debt({
        type: 'receivable',
        customer: customer,
        amount: debtAmount,
        paidAmount: 0,
        status: 'pending',
        description: transactionDesc,
        receipt: receipt._id,
        dueDate: null
      });
      await debt.save();
      
      // Update customer debt
      await Customer.findByIdAndUpdate(customer, {
        $inc: { debt: debtAmount }
      });
      } catch (debtError) {
        console.error('❌ Error creating debt:', debtError);
        throw new Error(`Qarz yaratishda xatolik: ${debtError.message}`);
      }
    }
    
    // Update customer purchase history and total purchases if customer is selected and not return
    if (customer && !isReturn) {
      const Customer = require('../models/Customer');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const customerDoc = await Customer.findById(customer);
      if (customerDoc) {
        // Update total purchases
        customerDoc.totalPurchases = (customerDoc.totalPurchases || 0) + total;
        
        // Find today's purchase history entry
        const todayEntry = customerDoc.purchaseHistory.find(entry => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === today.getTime();
        });
        
        if (todayEntry) {
          // Update existing entry
          todayEntry.amount += total;
        } else {
          // Create new entry for today
          customerDoc.purchaseHistory.push({
            date: today,
            amount: total,
            receiptId: receipt._id
          });
        }
        
        await customerDoc.save();
        
        // Send Telegram notification immediately
        const { sendSaleNotification } = require('../telegram/customerBot');
        
        // Don't wait for notification, send it asynchronously
        sendSaleNotification(customer, total)
          .then(sent => {
            if (sent) {
              console.log(`✅ Telegram notification sent to customer ${customer}`);
            } else {
              console.log(`⚠️ Customer ${customer} not registered in Telegram bot`);
            }
          })
          .catch(err => {
            console.error('❌ Error sending Telegram notification:', err);
          });
      }
    }
    
    // Emit socket event for real-time inventory update
    if (global.io) {
      if (!isHelper) {
        const eventData = {
          type: isReturn ? 'return' : 'sale',
          items: items.map(item => ({
            productId: item.product,
            quantity: item.quantity
          }))
        };
        console.log('📡 [Socket] Emitting inventory:updated event:', eventData);
        global.io.emit('inventory:updated', eventData);
        console.log('📡 [Socket] Event emitted to', global.io.engine.clientsCount, 'clients');
      }
    } else {
      console.error('❌ [Socket] global.io is undefined! Socket not initialized.');
    }
    
    // OPTIMIZED: Don't clear cache - let it stay for faster subsequent requests
    // Socket event already notified all clients to update their local state
    // clearInventoryCache(); // REMOVED - cache saqlanadi, tezroq ishlaydi
    
    res.status(201).json(receipt);
  } catch (error) {
    console.error('❌ [Receipts POST] Error creating receipt:', error);
    console.error('❌ [Receipts POST] Error stack:', error.stack);
    console.error('❌ [Receipts POST] Request body:', JSON.stringify(req.body, null, 2));
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// ===== SAVED RECEIPTS (cross-device sync) =====

// Get all saved receipts
router.get('/saved', auth, async (req, res) => {
  try {
    const receipts = await Receipt.find({ status: 'saved', createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Save a receipt (park)
router.post('/saved', auth, async (req, res) => {
  try {
    const { items, total, customer } = req.body;
    // Sanitize product IDs - extract valid ObjectId from composite cartId (e.g. "id_timestamp_random")
    const cleanItems = (items || []).map(item => ({
      ...item,
      product: item.product && item.product.includes('_') ? item.product.split('_')[0] : item.product
    }));
    const receipt = new Receipt({
      items: cleanItems,
      total,
      status: 'saved',
      createdBy: req.user._id,
      customer: customer || undefined
    });
    await receipt.save();

    if (global.io) {
      global.io.emit('saved-receipt:updated');
    }

    res.status(201).json(receipt);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Delete saved receipt
router.delete('/saved/:id', auth, async (req, res) => {
  try {
    await Receipt.findOneAndDelete({ _id: req.params.id, status: 'saved' });

    if (global.io) {
      global.io.emit('saved-receipt:updated');
    }

    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.put('/:id/approve', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Chek topilmadi' });
    if (receipt.status !== 'pending') return res.status(400).json({ message: 'Bu chek allaqachon ko\'rib chiqilgan' });

    // Check stock availability before approving
    for (const item of receipt.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Tovar topilmadi: ${item.name}` });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Yetarli tovar yo'q: ${item.name}. Mavjud: ${product.quantity}, So'ralgan: ${item.quantity}` 
        });
      }
    }

    receipt.status = 'approved';
    receipt.processedBy = req.user._id;
    
    for (const item of receipt.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
    }
    
    await receipt.save();
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.put('/:id/reject', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Chek topilmadi' });
    if (receipt.status !== 'pending') return res.status(400).json({ message: 'Bu chek allaqachon ko\'rib chiqilgan' });

    receipt.status = 'rejected';
    receipt.processedBy = req.user._id;
    await receipt.save();
    
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Approve archived receipt (move from archive to completed)
router.put('/:id/approve-archived', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Chek topilmadi' });
    if (receipt.status !== 'archived') {
      return res.status(400).json({ message: 'Faqat arxivlangan cheklar tasdiqlanadi' });
    }

    // Check stock availability
    for (const item of receipt.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Tovar topilmadi: ${item.name}` });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Yetarli tovar yo'q: ${item.name}. Mavjud: ${product.quantity}, So'ralgan: ${item.quantity}` 
        });
      }
    }

    // Update stock
    const WarehouseInventory = require('../models/WarehouseInventory');
    for (const item of receipt.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
      
      const inventory = await WarehouseInventory.findOne({ product: item.product });
      if (inventory) {
        inventory.quantity -= item.quantity;
        await inventory.save();
      }
    }

    receipt.status = 'completed';
    receipt.processedBy = req.user._id;
    await receipt.save();
    
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Archive receipt (move to archive, worker can continue working)
router.put('/:id/archive', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Chek topilmadi' });
    
    // Only allow archiving pending or approved receipts
    if (receipt.status !== 'pending' && receipt.status !== 'approved') {
      return res.status(400).json({ message: 'Faqat kutilayotgan yoki tasdiqlangan cheklar arxivlanadi' });
    }

    receipt.status = 'archived';
    await receipt.save();
    
    res.json({ message: 'Chek arxivlandi', receipt });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Delete receipt (for worker receipts after loading to kassa)
router.delete('/:id', auth, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      console.log('❌ [DELETE] Receipt not found:', req.params.id);
      return res.status(404).json({ message: 'Chek topilmadi' });
    }
    
    console.log('🗑️ [DELETE] Deleting receipt:', {
      id: req.params.id,
      status: receipt.status,
      createdBy: receipt.createdBy,
      userRole: req.user.role,
      userId: req.user._id
    });
    
    // Helpers can delete their own receipts (archived, draft, or pending)
    if (req.user.role === 'helper') {
      if (receipt.createdBy.toString() !== req.user._id.toString()) {
        console.log('❌ [DELETE] Permission denied - not owner');
        return res.status(403).json({ message: 'Ruxsat yo\'q' });
      }
      // Allow deleting archived, draft, or pending receipts (for loading from archive)
      if (!['archived', 'draft', 'pending'].includes(receipt.status)) {
        console.log('❌ [DELETE] Can only delete archived/draft/pending receipts, current status:', receipt.status);
        return res.status(400).json({ message: `Faqat arxivlangan, qoralama yoki kutilayotgan cheklar o'chiriladi. Hozirgi status: ${receipt.status}` });
      }
    } else {
      // Admin/cashier can delete draft, pending, approved, or archived (not completed)
      if (receipt.status === 'completed') {
        console.log('❌ [DELETE] Cannot delete completed receipt');
        return res.status(400).json({ message: 'Yakunlangan chekni o\'chirish mumkin emas' });
      }
    }

    await Receipt.findByIdAndDelete(req.params.id);
    console.log('✅ [DELETE] Receipt deleted successfully');
    
    // Emit socket event for real-time updates
    if (global.io) {
      console.log('📡 [Socket] Emitting receipt:deleted event:', {
        receiptId: req.params.id,
        status: receipt.status,
        createdBy: receipt.createdBy
      });
      global.io.emit('receipt:deleted', {
        receiptId: req.params.id,
        status: receipt.status,
        createdBy: receipt.createdBy
      });
    }
    
    res.json({ message: 'Chek o\'chirildi', deleted: true });
  } catch (error) {
    console.error('❌ [DELETE] Error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// SENIOR SOLUTION: Product return endpoint with automatic debt/payment handling
router.post('/return', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const { customerId, receiptId, items, returnTotal, originalPurchase } = req.body;
    
    console.log('🔄 [RETURN] Processing return:', {
      customerId,
      receiptId,
      itemsCount: items.length,
      returnTotal,
      originalPurchase
    });
    
    // Validate input
    if (!customerId || !items || items.length === 0 || !returnTotal) {
      return res.status(400).json({ message: 'Noto\'g\'ri ma\'lumotlar' });
    }
    
    const Customer = require('../models/Customer');
    const Debt = require('../models/Debt');
    const WarehouseInventory = require('../models/WarehouseInventory');
    
    // Get customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Mijoz topilmadi' });
    }
    
    // Get original receipt to update it
    const originalReceipt = await Receipt.findById(receiptId);
    if (!originalReceipt) {
      return res.status(404).json({ message: 'Asl chek topilmadi' });
    }
    
    console.log('📋 [RETURN] Original receipt:', {
      id: originalReceipt._id,
      total: originalReceipt.total,
      itemsCount: originalReceipt.items.length
    });
    
    // Calculate remaining items and total after return
    let remainingTotal = originalReceipt.total;
    const updatedItems = originalReceipt.items.map(item => {
      const returnItem = items.find(ri => ri.product === item.product.toString());
      if (returnItem) {
        const remainingQty = item.quantity - returnItem.quantity;
        const itemTotal = item.price * item.quantity;
        const returnItemTotal = item.price * returnItem.quantity;
        
        remainingTotal -= returnItemTotal;
        
        console.log(`📦 [RETURN] Item ${item.name}: ${item.quantity} → ${remainingQty} (returned: ${returnItem.quantity})`);
        
        return {
          ...item.toObject(),
          quantity: remainingQty
        };
      }
      return item.toObject();
    }).filter(item => item.quantity > 0); // Remove items with 0 quantity
    
    const isFullReturn = updatedItems.length === 0 || remainingTotal <= 0;
    
    console.log('📊 [RETURN] Receipt update:', {
      originalTotal: originalReceipt.total,
      returnTotal,
      remainingTotal,
      originalItemsCount: originalReceipt.items.length,
      remainingItemsCount: updatedItems.length,
      isFullReturn
    });
    
    // Create return receipt
    const returnReceipt = new Receipt({
      items: items.map(item => ({
        product: item.product,
        name: item.name,
        code: item.code,
        price: item.price,
        quantity: item.quantity
      })),
      total: returnTotal,
      paymentMethod: 'cash', // Default, will be adjusted
      customer: customerId,
      status: 'completed',
      isReturn: true,
      description: `Qaytarilgan: ${customer.name} - ${new Date().toLocaleDateString('uz-UZ')} - ${returnTotal.toLocaleString('uz-UZ')} so'm`,
      createdBy: req.user._id
    });
    
    await returnReceipt.save();
    console.log('✅ [RETURN] Return receipt created:', returnReceipt._id);
    
    // Update or delete original receipt
    if (isFullReturn) {
      // Mark receipt as fully returned (don't delete, keep for history)
      originalReceipt.status = 'returned';
      originalReceipt.isReturn = true;
      await originalReceipt.save();
      console.log('✅ [RETURN] Original receipt marked as fully returned');
    } else {
      // Update receipt with remaining items and new total
      originalReceipt.items = updatedItems;
      originalReceipt.total = remainingTotal;
      
      // Recalculate payment breakdown proportionally
      const returnRatio = returnTotal / originalPurchase.total;
      originalReceipt.cashAmount = Math.round((originalReceipt.cashAmount || 0) * (1 - returnRatio));
      originalReceipt.cardAmount = Math.round((originalReceipt.cardAmount || 0) * (1 - returnRatio));
      originalReceipt.debtAmount = Math.round((originalReceipt.debtAmount || 0) * (1 - returnRatio));
      
      await originalReceipt.save();
      console.log('✅ [RETURN] Original receipt updated with remaining items');
    }
    
    // Update product quantities (add back to inventory)
    for (const item of items) {
      // Update Product model
      await Product.findByIdAndUpdate(item.product, { 
        $inc: { quantity: item.quantity } 
      });
      
      // Update WarehouseInventory
      const inventory = await WarehouseInventory.findOne({ product: item.product });
      if (inventory) {
        inventory.quantity += item.quantity;
        await inventory.save();
        console.log(`📦 [RETURN] Added ${item.quantity} to inventory for ${item.name}`);
      }
    }
    
    // CORRECTED LOGIC: Handle payment refund priority
    // YANGI LOGIKA: Agar mijozning qarzi bo'lsa, AVVAL qarzdan ayriladi
    // 1. First reduce ANY customer debt (prioritize debt reduction)
    // 2. Then refund to card (proportional to original card payment)
    // 3. Then refund cash (proportional to original cash payment)
    
    let remainingRefund = returnTotal;
    const refundBreakdown = {
      debtReduced: 0,
      cardRefund: 0,
      cashRefund: 0
    };
    
    console.log('💰 [RETURN] Starting refund calculation:', {
      returnTotal,
      customerDebt: customer.debt,
      originalPurchase
    });
    
    // Step 1: YANGI - Reduce ANY customer debt FIRST (if customer has debt)
    if (customer.debt > 0 && remainingRefund > 0) {
      console.log('💰 [RETURN] Step 1: Customer has debt, reducing from total debt...');
      
      // Find ALL unpaid debts for this customer (oldest first)
      const allDebts = await Debt.find({
        customer: customerId,
        type: 'receivable',
        status: { $ne: 'paid' }
      }).sort({ createdAt: 1 }); // Oldest first
      
      console.log(`💰 [RETURN] Found ${allDebts.length} unpaid debts`);
      
      for (const debt of allDebts) {
        if (remainingRefund <= 0) break;
        
        const debtRemaining = debt.amount - debt.paidAmount;
        
        if (debtRemaining <= 0) {
          console.log(`⏭️  [RETURN] Skipping debt ${debt._id} (already paid)`);
          continue;
        }
        
        const debtReduction = Math.min(remainingRefund, debtRemaining);
        
        console.log(`💰 [RETURN] Reducing debt ${debt._id}:`, {
          debtAmount: debt.amount,
          debtPaid: debt.paidAmount,
          debtRemaining,
          debtReduction
        });
        
        // Add payment to debt
        debt.payments.push({
          amount: debtReduction,
          method: 'return',
          date: new Date(),
          description: `Mahsulot qaytarildi - ${returnTotal.toLocaleString('uz-UZ')} so'm`
        });
        debt.paidAmount += debtReduction;
        
        if (debt.paidAmount >= debt.amount) {
          debt.status = 'paid';
          console.log(`✅ [RETURN] Debt ${debt._id} fully paid!`);
        }
        
        await debt.save();
        
        // Update customer debt
        customer.debt -= debtReduction;
        
        remainingRefund -= debtReduction;
        refundBreakdown.debtReduced += debtReduction;
        
        console.log(`💰 [RETURN] Reduced debt by ${debtReduction} so'm, remaining refund: ${remainingRefund}`);
      }
    } else {
      console.log('💰 [RETURN] Step 1: Customer has no debt or no refund remaining');
    }
    
    // Step 2: Refund to card (proportional to original card payment)
    if (remainingRefund > 0 && originalPurchase.cardAmount > 0) {
      const cardRefund = Math.min(remainingRefund, originalPurchase.cardAmount);
      refundBreakdown.cardRefund = cardRefund;
      remainingRefund -= cardRefund;
      console.log(`💳 [RETURN] Step 2: Card refund: ${cardRefund} so'm, remaining: ${remainingRefund}`);
    } else {
      console.log('💳 [RETURN] Step 2: No card refund (remaining: %s, cardAmount: %s)', 
        remainingRefund, originalPurchase.cardAmount);
    }
    
    // Step 3: Refund cash (proportional to original cash payment)
    if (remainingRefund > 0 && originalPurchase.cashAmount > 0) {
      const cashRefund = Math.min(remainingRefund, originalPurchase.cashAmount);
      refundBreakdown.cashRefund = cashRefund;
      remainingRefund -= cashRefund;
      console.log(`💵 [RETURN] Step 3: Cash refund: ${cashRefund} so'm, remaining: ${remainingRefund}`);
    } else {
      console.log('💵 [RETURN] Step 3: No cash refund (remaining: %s, cashAmount: %s)', 
        remainingRefund, originalPurchase.cashAmount);
    }
    
    // Step 4 is removed - we already handled all debts in Step 1
    if (remainingRefund > 0) {
      console.log('⚠️  [RETURN] Warning: Remaining refund after all steps:', remainingRefund);
    }
    
    // Update customer total purchases
    customer.totalPurchases = Math.max(0, (customer.totalPurchases || 0) - returnTotal);
    await customer.save();
    
    console.log('✅ [RETURN] Customer updated:', {
      customerId: customer._id,
      name: customer.name,
      newDebt: customer.debt,
      newTotalPurchases: customer.totalPurchases
    });
    
    console.log('✅ [RETURN] Return processed successfully:', {
      returnTotal,
      refundBreakdown,
      returnReceiptId: returnReceipt._id,
      isFullReturn,
      remainingTotal: isFullReturn ? 0 : remainingTotal
    });
    
    // OPTIMIZED: Don't clear cache - Socket event handles updates
    // clearInventoryCache(); // REMOVED
    
    // Emit socket event
    if (global.io) {
      global.io.emit('inventory:updated', {
        type: 'return',
        items: items.map(item => ({
          productId: item.product,
          quantity: item.quantity
        }))
      });
      
      global.io.emit('customer:updated', {
        customerId: customer._id
      });
    }
    
    res.json({
      success: true,
      returnReceipt: {
        _id: returnReceipt._id,
        total: returnReceipt.total,
        items: returnReceipt.items,
        createdAt: returnReceipt.createdAt
      },
      refundBreakdown,
      customerUpdate: {
        debt: customer.debt,
        totalPurchases: customer.totalPurchases
      },
      receiptUpdate: {
        isFullReturn,
        remainingTotal,
        remainingItemsCount: updatedItems.length
      },
      message: 'Mahsulotlar muvaffaqiyatli qaytarildi'
    });
    
  } catch (error) {
    console.error('❌ [RETURN] Error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

module.exports = router;
