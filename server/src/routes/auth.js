const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    console.log('🔐 Login attempt:', { phone, passwordLength: password?.length });
    
    // Support login with phone or email (for backward compatibility)
    const user = await User.findOne({ 
      $or: [{ phone }, { email: phone }] 
    });
    
    if (!user) {
      console.log('❌ User not found with phone:', phone);
      return res.status(400).json({ message: 'Telefon raqam yoki parol noto\'g\'ri' });
    }
    
    console.log('✅ User found:', { name: user.name, phone: user.phone, role: user.role });

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', user.name);
      return res.status(400).json({ message: 'Telefon raqam yoki parol noto\'g\'ri' });
    }
    
    console.log('✅ Login successful:', user.name);

    // Helper users get 5 year token, others get 7 days
    const expiresIn = user.role === 'helper' ? '5y' : '7d';
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn });
    res.json({ token, user: { _id: user._id, name: user.name, phone: user.phone || user.email, role: user.role } });
  } catch (error) {
    console.error('❌ Login error:', error);
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

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    
    console.log('📝 Updating user profile:', {
      userId: user._id,
      oldName: user.name,
      newName: name,
      oldPhone: user.phone,
      newPhone: phone,
      passwordChanged: !!password
    });
    
    user.name = name;
    user.phone = phone;
    if (password) {
      user.password = password; // Will be hashed by pre-save hook
      console.log('🔐 Password will be updated and hashed');
    }
    await user.save();
    
    console.log('✅ User profile updated successfully');
    
    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

module.exports = router;
