const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({ createdBy: req.user._id }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.get('/helpers', auth, authorize('admin'), async (req, res) => {
  try {
    const helpers = await User.find({ 
      createdBy: req.user._id,
      role: { $in: ['cashier', 'helper'] }
    }).select('-password');
    res.json(helpers);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }

    const user = new User({ name, email, password, role, createdBy: req.user._id });
    await user.save();
    
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { name, email, role },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    res.json({ message: 'Foydalanuvchi o\'chirildi' });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

module.exports = router;
