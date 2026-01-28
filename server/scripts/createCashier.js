const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../src/models/User');

async function createCashier() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Check if cashier exists
    let cashier = await User.findOne({ role: 'cashier' });
    
    if (cashier) {
      console.log('📋 Existing cashier:', {
        name: cashier.name,
        phone: cashier.phone,
        role: cashier.role
      });

      // Update phone and password
      cashier.phone = '+998000000000'; // Will be formatted as 00 000 00 00 in UI
      cashier.password = '000000'; // Will be hashed by pre-save hook
      
      await cashier.save();

      console.log('✅ Cashier updated successfully!');
    } else {
      // Create new cashier
      cashier = new User({
        name: 'Kassir',
        phone: '+998000000000',
        password: '000000',
        role: 'cashier'
      });
      
      await cashier.save();
      console.log('✅ Cashier created successfully!');
    }

    console.log('📋 New credentials:', {
      phone: '00 000 00 00',
      password: '000000',
      role: 'cashier'
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createCashier();
