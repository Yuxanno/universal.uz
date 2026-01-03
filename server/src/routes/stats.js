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

    const [
      totalRevenue,
      todaySales,
      weekSales,
      monthSales,
      totalReceipts,
      totalProducts,
      lowStock,
      outOfStock
    ] = await Promise.all([
      Receipt.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Receipt.aggregate([{ $match: { status: 'completed', createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Receipt.aggregate([{ $match: { status: 'completed', createdAt: { $gte: weekAgo } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Receipt.aggregate([{ $match: { status: 'completed', createdAt: { $gte: monthAgo } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Receipt.countDocuments({ status: 'completed' }),
      Product.countDocuments(),
      Product.countDocuments({ $expr: { $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', '$minStock'] }] } }),
      Product.countDocuments({ quantity: 0 })
    ]);

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      todaySales: todaySales[0]?.total || 0,
      weekSales: weekSales[0]?.total || 0,
      monthSales: monthSales[0]?.total || 0,
      totalReceipts,
      totalProducts,
      lowStock,
      outOfStock
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.get('/chart', auth, authorize('admin'), async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const days = period === 'month' ? 30 : 7;
    
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const sales = await Receipt.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: date, $lt: nextDate } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
      
      data.push({
        date: date.toLocaleDateString('uz-UZ', { weekday: 'short' }),
        sales: sales[0]?.total || 0
      });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.get('/top-products', auth, authorize('admin'), async (req, res) => {
  try {
    const topProducts = await Receipt.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    
    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

module.exports = router;
