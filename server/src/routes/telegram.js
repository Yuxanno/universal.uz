const express = require('express');
const router = express.Router();
const { sendSaleNotification } = require('../telegram/customerBot');

/**
 * POST /api/telegram/notify-customer-sale
 * Send sale notification to customer via Telegram
 */
router.post('/notify-customer-sale', async (req, res) => {
  try {
    const { customerId, amount, receiptId } = req.body;
    
    if (!customerId || !amount) {
      return res.status(400).json({ message: 'customerId and amount are required' });
    }
    
    const sent = await sendSaleNotification(customerId, amount);
    
    if (sent) {
      res.json({ success: true, message: 'Notification sent' });
    } else {
      res.json({ success: false, message: 'Customer not registered in bot' });
    }
  } catch (error) {
    console.error('Error sending sale notification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
