const express = require('express');
const Receipt = require('../models/Receipt');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Real statistika - faqat sotuvlar va cheklar
    const [
      totalRevenue,
      todaySales,
      weekSales,
      monthSales,
      totalReceipts,
      peakHourData
    ] = await Promise.all([
      Receipt.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Receipt.aggregate([{ $match: { status: 'completed', createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Receipt.aggregate([{ $match: { status: 'completed', createdAt: { $gte: weekAgo } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Receipt.aggregate([{ $match: { status: 'completed', createdAt: { $gte: monthAgo } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Receipt.countDocuments({ status: 'completed' }),
      Receipt.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 }, total: { $sum: '$total' } } },
        { $sort: { total: -1 } },
        { $limit: 1 }
      ])
    ]);

    let peakHour = '';
    if (peakHourData.length > 0) {
      const hour = peakHourData[0]._id;
      peakHour = `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
    }

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      todaySales: todaySales[0]?.total || 0,
      weekSales: weekSales[0]?.total || 0,
      monthSales: monthSales[0]?.total || 0,
      totalReceipts,
      peakHour
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.get('/chart', auth, authorize('admin'), async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Uzbekistan timezone offset (UTC+5)
    const tzOffset = 5 * 60; // minutes
    
    if (period === 'today') {
      // Hourly data for today - single aggregation query
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const hourlyData = await Receipt.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: today, $lt: tomorrow } } },
        { 
          $group: { 
            _id: { 
              $hour: { 
                date: '$createdAt', 
                timezone: '+05:00' 
              } 
            }, 
            total: { $sum: '$total' } 
          } 
        },
        { $sort: { _id: 1 } }
      ]);
      
      // Create full 24-hour array
      const hourMap = new Map(hourlyData.map(h => [h._id, h.total]));
      const data = [];
      for (let hour = 0; hour < 24; hour++) {
        data.push({
          date: `${hour.toString().padStart(2, '0')}:00`,
          sales: hourMap.get(hour) || 0
        });
      }
      
      res.json(data);
    } else {
      // Daily data for week/month - single aggregation query
      const days = period === 'month' ? 30 : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);
      startDate.setHours(0, 0, 0, 0);
      
      const dailyData = await Receipt.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startDate } } },
        { 
          $group: { 
            _id: { 
              $dateToString: { 
                format: '%Y-%m-%d', 
                date: '$createdAt',
                timezone: '+05:00'
              } 
            }, 
            total: { $sum: '$total' } 
          } 
        },
        { $sort: { _id: 1 } }
      ]);
      
      // Create full days array
      const dayMap = new Map(dailyData.map(d => [d._id, d.total]));
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        data.push({
          date: date.toLocaleDateString('uz-UZ', { weekday: 'short' }),
          sales: dayMap.get(dateKey) || 0
        });
      }
      
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.get('/top-products', auth, authorize('admin'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topProducts = await Receipt.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      { 
        $group: { 
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        } 
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit }
    ]);
    
    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Sales Report - Professional detailed report
router.get('/sales-report', auth, authorize('admin'), async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    // Fetch all receipts with populated data
    const receipts = await Receipt.find({
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('customer', 'name')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .lean();
    
    // Calculate statistics
    const totalSales = receipts.reduce((sum, r) => sum + r.total, 0);
    const totalReceipts = receipts.length;
    const averageCheck = totalReceipts > 0 ? Math.round(totalSales / totalReceipts) : 0;
    
    const cashTotal = receipts.reduce((sum, r) => sum + (r.cashAmount || 0), 0);
    const cardTotal = receipts.reduce((sum, r) => sum + (r.cardAmount || 0), 0);
    const debtTotal = receipts.reduce((sum, r) => sum + (r.debtAmount || 0), 0);
    
    // Top products
    const productMap = new Map();
    receipts.forEach(receipt => {
      receipt.items.forEach(item => {
        const key = item.name;
        if (productMap.has(key)) {
          const existing = productMap.get(key);
          existing.quantity += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          productMap.set(key, {
            name: item.name,
            quantity: item.quantity,
            revenue: item.price * item.quantity
          });
        }
      });
    });
    
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Hourly/Daily data
    const timeMap = new Map();
    receipts.forEach(receipt => {
      const date = new Date(receipt.createdAt);
      let key;
      
      if (period === 'today') {
        key = date.getHours().toString().padStart(2, '0') + ':00';
      } else {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD format for sorting
      }
      
      if (timeMap.has(key)) {
        const existing = timeMap.get(key);
        existing.sales += receipt.total;
        existing.count += 1;
      } else {
        timeMap.set(key, { key, sales: receipt.total, count: 1, date });
      }
    });
    
    let hourlyData = [];
    
    // Fill missing hours/days and sort correctly
    if (period === 'today') {
      // For today: 00:00 to 23:00
      for (let h = 0; h < 24; h++) {
        const hourKey = h.toString().padStart(2, '0') + ':00';
        const existing = timeMap.get(hourKey);
        hourlyData.push({ 
          hour: hourKey, 
          sales: existing ? existing.sales : 0, 
          count: existing ? existing.count : 0 
        });
      }
    } else {
      // For week/month: sort by date (oldest to newest)
      const days = period === 'month' ? 30 : 7;
      const sortedEntries = Array.from(timeMap.values()).sort((a, b) => 
        new Date(a.key).getTime() - new Date(b.key).getTime()
      );
      
      // Create array with all days - sorted from oldest to newest
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split('T')[0];
        const existing = sortedEntries.find(e => e.key === dateKey);
        
        // Format: "26.01" (DD.MM)
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        hourlyData.push({
          hour: `${day}.${month}`,
          sales: existing ? existing.sales : 0,
          count: existing ? existing.count : 0,
          sortKey: date.getTime() // For debugging
        });
      }
      
      console.log('📊 Hourly data (sorted):', hourlyData.map(d => `${d.hour} (${new Date(d.sortKey).toLocaleDateString()})` ));
    }
    
    // Payment breakdown - correct order: Cash, Card, Debt
    const paymentBreakdown = [];
    
    if (cashTotal > 0) {
      paymentBreakdown.push({ 
        method: 'Naqd', 
        amount: cashTotal, 
        percentage: totalSales > 0 ? Math.round((cashTotal / totalSales) * 100) : 0 
      });
    }
    
    if (cardTotal > 0) {
      paymentBreakdown.push({ 
        method: 'Karta', 
        amount: cardTotal, 
        percentage: totalSales > 0 ? Math.round((cardTotal / totalSales) * 100) : 0 
      });
    }
    
    if (debtTotal > 0) {
      paymentBreakdown.push({ 
        method: 'Qarz', 
        amount: debtTotal, 
        percentage: totalSales > 0 ? Math.round((debtTotal / totalSales) * 100) : 0 
      });
    }
    
    res.json({
      receipts,
      stats: {
        totalSales,
        totalReceipts,
        averageCheck,
        cashTotal,
        cardTotal,
        debtTotal,
        topProducts,
        hourlyData,
        paymentBreakdown
      }
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

module.exports = router;
