/**
 * Script to fix payable debt without customer
 * 
 * Run: node server/scripts/fix-payable-debt.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Debt = require('../src/models/Debt');
const Customer = require('../src/models/Customer');

async function fixPayableDebt() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find payable debt without customer
    const payableDebts = await Debt.find({ type: 'payable' });
    console.log(`📊 Found ${payableDebts.length} payable debts\n`);

    for (const debt of payableDebts) {
      if (!debt.customer) {
        console.log(`❌ Debt without customer found:`);
        console.log(`   ID: ${debt._id}`);
        console.log(`   Amount: ${debt.amount.toLocaleString()} so'm`);
        console.log(`   Description: ${debt.description || 'N/A'}`);
        console.log(`   Created: ${debt.createdAt}`);
        
        // Delete this debt
        await Debt.deleteOne({ _id: debt._id });
        console.log(`   ✅ Deleted\n`);
      } else {
        const customer = await Customer.findById(debt.customer);
        console.log(`✅ Valid debt:`);
        console.log(`   Customer: ${customer?.name || 'Unknown'}`);
        console.log(`   Amount: ${debt.amount.toLocaleString()} so'm`);
        console.log(`   Remaining: ${(debt.amount - debt.paidAmount).toLocaleString()} so'm\n`);
      }
    }

    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPayableDebt();
