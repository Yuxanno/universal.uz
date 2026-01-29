const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../src/models/User');

/**
 * Script to update user password by phone number
 * Usage: node server/scripts/updateUserPassword.js
 */

async function updateUserPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Get all users
    const users = await User.find({}).select('name phone role');
    
    console.log('📋 AVAILABLE USERS:');
    console.log('═'.repeat(80));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.role.toUpperCase().padEnd(10)} - ${user.name.padEnd(20)} - ${user.phone}`);
    });
    
    console.log('\n\n🔐 DEFAULT PASSWORDS FOR EACH ROLE:');
    console.log('═'.repeat(80));
    console.log('Admin:   Phone: +998 (00) 000-00-00  →  Password: 000000');
    console.log('Kassir:  Phone: +998333333333        →  Password: 333333');
    console.log('Helper:  Phone: +998123456789        →  Password: 123456');
    
    console.log('\n\n🔧 UPDATING PASSWORDS...');
    console.log('═'.repeat(80));
    
    // Update Admin with phone +998 (00) 000-00-00
    const admin = await User.findOne({ phone: '+998 (00) 000-00-00' });
    if (admin) {
      admin.password = '000000'; // Will be hashed by pre-save hook
      await admin.save();
      console.log('✅ Admin password updated: 000000');
    }
    
    // Update Kassir
    const kassir = await User.findOne({ phone: '+998333333333' });
    if (kassir) {
      kassir.password = '333333';
      await kassir.save();
      console.log('✅ Kassir password updated: 333333');
    }
    
    // Update Helper Ozodbek
    const helper = await User.findOne({ phone: '+998123456789' });
    if (helper) {
      helper.password = '123456';
      await helper.save();
      console.log('✅ Helper (Ozodbek) password updated: 123456');
    }
    
    // Update other helpers with their phone last 6 digits
    const helpers = await User.find({ 
      role: 'helper',
      phone: { $nin: ['+998123456789'] }
    });
    
    for (const h of helpers) {
      // Extract last 6 digits from phone
      const digits = h.phone.replace(/\D/g, ''); // Remove non-digits
      const password = digits.slice(-6); // Last 6 digits
      
      h.password = password;
      await h.save();
      console.log(`✅ Helper (${h.name}) password updated: ${password}`);
    }
    
    // Update Azizbek admin
    const azizbek = await User.findOne({ name: 'Azizbek', role: 'admin' });
    if (azizbek) {
      const digits = azizbek.phone.replace(/\D/g, '');
      const password = digits.slice(-6);
      azizbek.password = password;
      await azizbek.save();
      console.log(`✅ Admin (Azizbek) password updated: ${password}`);
    }
    
    console.log('\n\n📱 UPDATED LOGIN CREDENTIALS:');
    console.log('═'.repeat(80));
    
    const updatedUsers = await User.find({}).select('name phone role');
    
    console.log('\n🔐 ADMIN:');
    updatedUsers.filter(u => u.role === 'admin').forEach(u => {
      const digits = u.phone.replace(/\D/g, '');
      const pass = u.phone === '+998 (00) 000-00-00' ? '000000' : digits.slice(-6);
      console.log(`   ${u.name.padEnd(20)} - Phone: ${u.phone.padEnd(20)} - Password: ${pass}`);
    });
    
    console.log('\n🔐 KASSIR:');
    updatedUsers.filter(u => u.role === 'cashier').forEach(u => {
      console.log(`   ${u.name.padEnd(20)} - Phone: ${u.phone.padEnd(20)} - Password: 333333`);
    });
    
    console.log('\n🔐 HELPER:');
    updatedUsers.filter(u => u.role === 'helper').forEach(u => {
      const digits = u.phone.replace(/\D/g, '');
      const pass = u.phone === '+998123456789' ? '123456' : digits.slice(-6);
      console.log(`   ${u.name.padEnd(20)} - Phone: ${u.phone.padEnd(20)} - Password: ${pass}`);
    });
    
    console.log('\n✅ All passwords updated successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateUserPassword();
