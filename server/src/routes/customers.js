const express = require('express');
const Customer = require('../models/Customer');
const Receipt = require('../models/Receipt');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const customers = await Customer.find(query);
    
    // Get purchase totals for each customer
    const customerIds = customers.map(c => c._id);
    const purchaseStats = await Receipt.aggregate([
      { 
        $match: { 
          customer: { $in: customerIds },
          status: { $in: ['completed', 'approved'] },
          isReturn: { $ne: true }
        } 
      },
      { 
        $group: { 
          _id: '$customer', 
          totalPurchases: { $sum: '$total' },
          purchaseCount: { $sum: 1 }
        } 
      }
    ]);
    
    // Map purchase stats to customers
    const statsMap = {};
    purchaseStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        totalPurchases: stat.totalPurchases,
        purchaseCount: stat.purchaseCount
      };
    });
    
    const customersWithStats = customers.map(c => ({
      ...c.toObject(),
      totalPurchases: statsMap[c._id.toString()]?.totalPurchases || 0,
      purchaseCount: statsMap[c._id.toString()]?.purchaseCount || 0
    }));
    
    res.json(customersWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Mijoz topilmadi' });
    
    // Get detailed purchase history with receipts
    const receipts = await Receipt.find({
      customer: req.params.id,
      status: { $in: ['completed', 'approved'] },
      isReturn: { $ne: true }
    }).sort({ createdAt: -1 }).limit(50);
    
    // Calculate total purchases and count
    const purchaseStats = await Receipt.aggregate([
      { 
        $match: { 
          customer: customer._id,
          status: { $in: ['completed', 'approved'] },
          isReturn: { $ne: true }
        } 
      },
      { 
        $group: { 
          _id: null,
          totalPurchases: { $sum: '$total' },
          purchaseCount: { $sum: 1 }
        } 
      }
    ]);
    
    // Get debt payments from purchase history
    const debtPayments = customer.purchaseHistory
      .filter(entry => entry.type === 'debt_payment')
      .map(entry => ({
        date: entry.date,
        amount: entry.amount,
        paymentMethod: entry.paymentMethod,
        debtId: entry.debtId,
        receiptId: entry.receiptId,
        type: 'debt_payment'
      }));
    
    // Combine receipts with purchases (without debt payments inside)
    const purchasesWithPayments = receipts.map(r => {
      return {
        date: r.createdAt,
        items: r.items,
        total: r.total,
        cashAmount: r.cashAmount || 0,
        cardAmount: r.cardAmount || 0,
        debtAmount: r.debtAmount || 0,
        paymentMethod: r.paymentMethod,
        receiptId: r._id,
        isReturn: r.isReturn,
        type: 'purchase'
      };
    });
    
    const customerData = customer.toObject();
    customerData.totalPurchases = purchaseStats[0]?.totalPurchases || 0;
    customerData.purchaseCount = purchaseStats[0]?.purchaseCount || 0;
    customerData.detailedPurchaseHistory = [
      ...purchasesWithPayments,
      ...debtPayments
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(customerData);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.post('/', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const customer = new Customer({ ...req.body, createdBy: req.user._id });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.put('/:id', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: 'Mijoz topilmadi' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Mijoz topilmadi' });
    res.json({ message: 'Mijoz o\'chirildi' });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

module.exports = router;
