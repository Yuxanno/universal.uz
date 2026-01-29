const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../src/models/User');

async function fixAdminPhone() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Find admin with wrong phone format
    const admin = await User.findOne({ phone: '+998 (00) 000-00-00' });
    
    if (!admin) {
      console.log('❌ Admin with phone +998 (00) 000-00-00 not found');
      process.exit(1);
    }
    
    console.log('📋 Current admin info:');
    console.log('   Name:', admin.name);
    console.log('   Phone:', admin.phone);
    console.log('   Role:', admin.role);
    
    // Update phone to simple format
    admin.phone = '+998000000000';
    admin.password = '000000'; // Reset password
    await admin.save();
    
    console.log('\n✅ Admin updated successfully!');
    console.log('📱 New login credentials:');
    console.log('   Phone: +998000000000');
    console.log('   Password: 000000');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAdminPhone();
