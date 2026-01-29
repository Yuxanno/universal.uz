const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../src/models/User');

async function checkAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Get all users
    const users = await User.find({}).select('name phone email role createdAt');
    
    console.log('\n📊 TOTAL USERS:', users.length);
    console.log('═'.repeat(80));
    
    // Group by role
    const byRole = {
      admin: [],
      cashier: [],
      helper: []
    };
    
    users.forEach(user => {
      if (byRole[user.role]) {
        byRole[user.role].push(user);
      }
    });
    
    // Display by role
    console.log('\n👥 USERS BY ROLE:');
    console.log('─'.repeat(80));
    
    Object.keys(byRole).forEach(role => {
      console.log(`\n🔹 ${role.toUpperCase()} (${byRole[role].length} users):`);
      byRole[role].forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name}`);
        console.log(`      📞 Phone: ${user.phone || 'N/A'}`);
        console.log(`      📧 Email: ${user.email || 'N/A'}`);
        console.log(`      📅 Created: ${user.createdAt.toLocaleDateString('uz-UZ')}`);
        console.log('');
      });
    });
    
    // Check for duplicate phones
    console.log('\n🔍 CHECKING FOR DUPLICATE PHONES:');
    console.log('─'.repeat(80));
    
    const phoneMap = new Map();
    users.forEach(user => {
      if (user.phone) {
        if (!phoneMap.has(user.phone)) {
          phoneMap.set(user.phone, []);
        }
        phoneMap.get(user.phone).push(user);
      }
    });
    
    let duplicatesFound = false;
    phoneMap.forEach((usersWithPhone, phone) => {
      if (usersWithPhone.length > 1) {
        duplicatesFound = true;
        console.log(`\n⚠️  DUPLICATE PHONE: ${phone}`);
        usersWithPhone.forEach(user => {
          console.log(`   - ${user.name} (${user.role}) - ID: ${user._id}`);
        });
      }
    });
    
    if (!duplicatesFound) {
      console.log('✅ No duplicate phones found');
    }
    
    // Check for users without phone
    console.log('\n\n🔍 CHECKING FOR USERS WITHOUT PHONE:');
    console.log('─'.repeat(80));
    
    const usersWithoutPhone = users.filter(u => !u.phone);
    if (usersWithoutPhone.length > 0) {
      console.log(`⚠️  ${usersWithoutPhone.length} users without phone:`);
      usersWithoutPhone.forEach(user => {
        console.log(`   - ${user.name} (${user.role}) - ID: ${user._id}`);
      });
    } else {
      console.log('✅ All users have phone numbers');
    }
    
    // Display login credentials for testing
    console.log('\n\n🔐 LOGIN CREDENTIALS FOR TESTING:');
    console.log('═'.repeat(80));
    console.log('\n⚠️  NOTE: Passwords are hashed in database.');
    console.log('To set/reset passwords, use updateAdminCredentials.js script\n');
    
    console.log('📱 CURRENT PHONE NUMBERS:');
    users.forEach(user => {
      if (user.phone) {
        console.log(`   ${user.role.toUpperCase().padEnd(10)} - ${user.name.padEnd(20)} - ${user.phone}`);
      }
    });
    
    // Summary
    console.log('\n\n📋 SUMMARY:');
    console.log('═'.repeat(80));
    console.log(`Total Users: ${users.length}`);
    console.log(`Admin: ${byRole.admin.length}`);
    console.log(`Cashier: ${byRole.cashier.length}`);
    console.log(`Helper: ${byRole.helper.length}`);
    console.log(`Users without phone: ${usersWithoutPhone.length}`);
    console.log(`Duplicate phones: ${duplicatesFound ? 'YES ⚠️' : 'NO ✅'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllUsers();
