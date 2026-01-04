const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    
    const existingUser = await User.findOne({ 
      $or: [{ phone }, { email: phone }] 
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan' });
    }

    const user = new User({ name, phone, password, role: 'admin' });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.status(201).json({ token, user: { _id: user._id, name: user.name, phone: user.phone, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // Support login with phone or email (for backward compatibility)
    const user = await User.findOne({ 
      $or: [{ phone }, { email: phone }] 
    });
    if (!user) return res.status(400).json({ message: 'Telefon raqam yoki parol noto\'g\'ri' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Telefon raqam yoki parol noto\'g\'ri' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, name: user.name, phone: user.phone || user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  const user = req.user;
  res.json({
    _id: user._id,
    name: user.name,
    phone: user.phone || user.email,
    role: user.role,
    createdAt: user.createdAt
  });
});

module.exports = router;
