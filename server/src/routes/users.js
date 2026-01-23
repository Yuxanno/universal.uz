const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for user image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/users');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Faqat rasm fayllari ruxsat etilgan!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({ createdBy: req.user._id }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.get('/helpers', auth, authorize('admin', 'cashier'), async (req, res) => {
  try {
    // For admin - show their created helpers
    // For cashier - show all helpers in the system
    const query = req.user.role === 'admin' 
      ? { createdBy: req.user._id, role: { $in: ['cashier', 'helper'] } }
      : { role: { $in: ['cashier', 'helper'] } };
    
    const helpers = await User.find(query).select('-password');
    res.json(helpers);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, phone, password, role, image } = req.body;
    
    const existingUser = await User.findOne({ 
      $or: [{ phone }, { email: phone }] 
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan' });
    }

    const user = new User({ name, phone, password, role, image, createdBy: req.user._id });
    await user.save();
    
    res.status(201).json({ _id: user._id, name: user.name, phone: user.phone, role: user.role, image: user.image });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, phone, role, password, image } = req.body;
    
    const user = await User.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    
    // Delete old image if new image is provided and old one exists
    if (image && user.image && user.image !== image) {
      const baseUrl = process.env.BASE_URL || '';
      let oldImagePath = user.image;
      if (baseUrl && oldImagePath.startsWith(baseUrl)) {
        oldImagePath = oldImagePath.replace(baseUrl, '');
      }
      const fullPath = path.join(__dirname, '../..', oldImagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    
    user.name = name;
    user.phone = phone;
    user.role = role;
    if (image !== undefined) {
      user.image = image;
    }
    if (password) {
      user.password = password;
    }
    await user.save();
    
    const result = user.toObject();
    delete result.password;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    
    // Delete user image if exists
    if (user.image) {
      const baseUrl = process.env.BASE_URL || '';
      let imagePath = user.image;
      if (baseUrl && imagePath.startsWith(baseUrl)) {
        imagePath = imagePath.replace(baseUrl, '');
      }
      const fullPath = path.join(__dirname, '../..', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    
    res.json({ message: 'Foydalanuvchi o\'chirildi' });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Upload user image
router.post('/upload-image', auth, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Rasm yuklanmadi' });
    }
    const baseUrl = process.env.BASE_URL || '';
    const imagePath = `${baseUrl}/uploads/users/${req.file.filename}`;
    res.json({ image: imagePath });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Delete user image
router.delete('/delete-image', auth, authorize('admin'), async (req, res) => {
  try {
    let { imagePath } = req.body;
    if (!imagePath) return res.status(400).json({ message: 'Rasm yo\'li ko\'rsatilmagan' });
    
    const baseUrl = process.env.BASE_URL || '';
    if (baseUrl && imagePath.startsWith(baseUrl)) {
      imagePath = imagePath.replace(baseUrl, '');
    }
    
    const fullPath = path.join(__dirname, '../..', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    res.json({ message: 'Rasm o\'chirildi' });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

module.exports = router;
