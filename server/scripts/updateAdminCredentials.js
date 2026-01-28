const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../src/models/User');

async function updateAdminCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('📋 Current admin:', {
      name: admin.name,
      phone: admin.phone,
      role: admin.role
    });

    // Update phone and password
    const newPhone = '+998333333333'; // Will be formatted as 33 333 33 33 in UI
    const newPassword = '333333';

    admin.phone = newPhone;
    admin.password = newPassword; // Will be hashed by pre-save hook
    
    await admin.save();

    console.log('✅ Admin credentials updated successfully!');
    console.log('📋 New credentials:', {
      phone: newPhone,
      password: newPassword
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateAdminCredentials();
