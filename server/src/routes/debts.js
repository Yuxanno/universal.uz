const express = require('express');
const Debt = require('../models/Debt');
const Customer = require('../models/Customer');
const { auth, authorize } = require('../middleware/auth');
const { getBot } = require('../telegram/bot');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    
    const debts = await Debt.find(query)
      .populate('customer', 'name phone')
      .populate({
        path: 'receipt',
        populate: [
          { path: 'items.product', select: 'name code' },
          { path: 'createdBy', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });
    res.json(debts);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const typeFilter = type ? { type } : {};

    const stats = {
      total: await Debt.countDocuments(typeFilter),
      pending: await Debt.countDocuments({ ...typeFilter, status: 'pending' }),
      today: await Debt.countDocuments({ ...typeFilter, status: { $ne: 'paid' }, dueDate: { $gte: today, $lt: new Date(today.getTime() + 86400000) } }),
      overdue: await Debt.countDocuments({ ...typeFilter, status: 'overdue' }),
      paid: await Debt.countDocuments({ ...typeFilter, status: 'paid' }),
      blacklist: await Debt.countDocuments({ ...typeFilter, status: 'blacklist' }),
      totalAmount: (await Debt.aggregate([
        { $match: { ...typeFilter, status: { $ne: 'paid' } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } }
      ]))[0]?.total || 0
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// NEW: Get debts grouped by customer
router.get('/grouped', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const typeFilter = type ? { type } : {};
    
    // Aggregate debts by customer
    const groupedDebts = await Debt.aggregate([
      { $match: typeFilter },
      {
        $group: {
          _id: '$customer',
          totalAmount: { $sum: '$amount' },
          totalPaid: { $sum: '$paidAmount' },
          remainingAmount: { $sum: { $subtract: ['$amount', '$paidAmount'] } },
          debtCount: { $sum: 1 },
          debts: {
            $push: {
              _id: '$_id',
              amount: '$amount',
              paidAmount: '$paidAmount',
              dueDate: '$dueDate',
              status: '$status',
              description: '$description',
              collateral: '$collateral',
              receipt: '$receipt',
              payments: '$payments',
              createdAt: '$createdAt'
            }
          },
          latestDebt: { $max: '$createdAt' },
          oldestDueDate: { $min: '$dueDate' }
        }
      },
      { $sort: { remainingAmount: -1 } }
    ]);
    
    // Populate customer details
    await Customer.populate(groupedDebts, { path: '_id', select: 'name phone address' });
    
    // Transform data for frontend
    const result = groupedDebts.map(group => ({
      customer: group._id,
      totalAmount: group.totalAmount,
      totalPaid: group.totalPaid,
      remainingAmount: group.remainingAmount,
      debtCount: group.debtCount,
      debts: group.debts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      latestDebt: group.latestDebt,
      oldestDueDate: group.oldestDueDate,
      status: group.remainingAmount === 0 ? 'paid' : 
              (group.oldestDueDate && new Date(group.oldestDueDate) < new Date()) ? 'overdue' : 'pending'
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching grouped debts:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.post('/', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const { type, customer, creditorName, amount, dueDate, description, collateral } = req.body;
    
    const debtData = {
      type: type || 'receivable',
      amount,
      dueDate: dueDate || null, // If empty, set to null
      description,
      collateral,
      createdBy: req.user._id
    };
    
    if (type === 'payable') {
      // Own debt - I owe someone
      debtData.creditorName = creditorName;
    } else {
      // Customer debt - they owe me
      debtData.customer = customer;
      await Customer.findByIdAndUpdate(customer, { $inc: { debt: amount } });
    }
    
    const debt = new Debt(debtData);
    await debt.save();
    
    res.status(201).json(debt);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.post('/:id/payment', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const { amount, method } = req.body;
    const debt = await Debt.findById(req.params.id).populate('customer');
    if (!debt) return res.status(404).json({ message: 'Qarz topilmadi' });

    const oldPaidAmount = debt.paidAmount;
    const oldRemainingAmount = debt.amount - debt.paidAmount;

    debt.payments.push({ amount, method });
    debt.paidAmount += amount;
    
    const newRemainingAmount = debt.amount - debt.paidAmount;
    
    if (debt.paidAmount >= debt.amount) {
      debt.status = 'paid';
    }
    
    await debt.save();
    
    // Only update customer debt for receivable type
    if (debt.type === 'receivable' && debt.customer) {
      await Customer.findByIdAndUpdate(debt.customer, { $inc: { debt: -amount } });
      
      // Add debt payment to customer's purchase history
      const customerDoc = await Customer.findById(debt.customer);
      if (customerDoc) {
        // Add as debt payment entry
        customerDoc.purchaseHistory.push({
          date: new Date(),
          amount: amount,
          receiptId: debt.receipt || null,
          type: 'debt_payment',
          debtId: debt._id,
          paymentMethod: method
        });
        
        await customerDoc.save();
      }
      
      // Send Telegram notification to customer
      try {
        const bot = getBot();
        if (bot && debt.customer) {
          const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
          
          let message = `💰 *To'lov qabul qilindi!*\n\n`;
          message += `Hurmatli ${debt.customer.name},\n\n`;
          message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
          message += `✅ *To'lov ma'lumotlari:*\n\n`;
          message += `💵 To'langan summa: *${formatNumber(amount)} so'm*\n`;
          message += `📅 Sana: ${new Date().toLocaleDateString('uz-UZ')}\n`;
          message += `💳 Usul: ${method === 'cash' ? 'Naqd' : 'Karta'}\n\n`;
          message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
          message += `📊 *Qarz holati:*\n\n`;
          message += `📋 Jami qarz: *${formatNumber(debt.amount)} so'm*\n`;
          message += `✅ To'langan: *${formatNumber(debt.paidAmount)} so'm*\n`;
          message += `⏳ Qolgan: *${formatNumber(newRemainingAmount)} so'm*\n\n`;
          
          if (newRemainingAmount === 0) {
            message += `🎉 *Tabriklaymiz!*\n\n`;
            message += `Qarzingiz to'liq to'landi!\n\n`;
          } else {
            const paymentPercent = Math.round((debt.paidAmount / debt.amount) * 100);
            const progressBar = '█'.repeat(Math.round(paymentPercent / 10)) + '░'.repeat(10 - Math.round(paymentPercent / 10));
            message += `📈 To'lov jarayoni: ${progressBar} ${paymentPercent}%\n\n`;
          }
          
          message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
          message += `Rahmat! 🙏\n\n`;
          message += `🏪 *Universal Savdo Markazi*`;
          
          // Try to find customer's chat ID from saved data
          const fs = require('fs');
          const path = require('path');
          const customerDataFile = path.join(__dirname, '../../.telegram_customers.json');
          
          if (fs.existsSync(customerDataFile)) {
            const customerData = JSON.parse(fs.readFileSync(customerDataFile, 'utf8'));
            const customerEntry = Object.entries(customerData).find(
              ([chatId, data]) => data.customerId === debt.customer._id.toString()
            );
            
            if (customerEntry) {
              const [chatId] = customerEntry;
              await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
              console.log(`✅ Payment notification sent to customer ${debt.customer.name}`);
            } else {
              console.log(`ℹ️  Customer ${debt.customer.name} not registered in bot`);
            }
          }
        }
      } catch (telegramError) {
        console.error('Error sending Telegram notification:', telegramError.message);
        // Don't fail the payment if Telegram fails
      }
    }
    
    res.json(debt);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.put('/:id', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const { type, customer, creditorName, amount, dueDate, description, collateral } = req.body;
    const debt = await Debt.findById(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Qarz topilmadi' });
    
    // Update customer debt if amount changed (for receivable type)
    if (debt.type === 'receivable' && debt.customer) {
      const oldRemaining = debt.amount - debt.paidAmount;
      const newRemaining = amount - debt.paidAmount;
      const diff = newRemaining - oldRemaining;
      if (diff !== 0) {
        await Customer.findByIdAndUpdate(debt.customer, { $inc: { debt: diff } });
      }
    }
    
    debt.amount = amount;
    debt.dueDate = dueDate || null; // If empty, set to null
    debt.description = description;
    debt.collateral = collateral;
    
    if (type === 'payable') {
      debt.creditorName = creditorName;
    } else {
      debt.customer = customer;
    }
    
    await debt.save();
    res.json(debt);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const debt = await Debt.findByIdAndDelete(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Qarz topilmadi' });
    res.json({ message: 'Qarz o\'chirildi' });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

module.exports = router;
