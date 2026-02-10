/**
 * Script to check debt data in database
 * 
 * Run: node server/scripts/check-debts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Debt = require('../src/models/Debt');
const Customer = require('../src/models/Customer');

async function checkDebts() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get all debts
    const allDebts = await Debt.find({}).populate('customer', 'name phone');
    console.log(`📊 Total debts: ${allDebts.length}\n`);

    // Group by type
    const receivableDebts = allDebts.filter(d => d.type === 'receivable');
    const payableDebts = allDebts.filter(d => d.type === 'payable');

    console.log('📥 RECEIVABLE (Menga qarzdor):');
    console.log(`   Count: ${receivableDebts.length}`);
    let receivableTotal = 0;
    receivableDebts.forEach(d => {
      const remaining = d.amount - d.paidAmount;
      receivableTotal += remaining;
      console.log(`   - ${d.customer?.name || 'Unknown'}: ${d.amount.toLocaleString()} so'm (Paid: ${d.paidAmount.toLocaleString()}, Remaining: ${remaining.toLocaleString()})`);
    });
    console.log(`   Total remaining: ${receivableTotal.toLocaleString()} so'm\n`);

    console.log('📤 PAYABLE (Men qarzdorman):');
    console.log(`   Count: ${payableDebts.length}`);
    let payableTotal = 0;
    payableDebts.forEach(d => {
      const remaining = d.amount - d.paidAmount;
      payableTotal += remaining;
      console.log(`   - ${d.customer?.name || 'Unknown'}: ${d.amount.toLocaleString()} so'm (Paid: ${d.paidAmount.toLocaleString()}, Remaining: ${remaining.toLocaleString()})`);
    });
    console.log(`   Total remaining: ${payableTotal.toLocaleString()} so'm\n`);

    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDebts();
