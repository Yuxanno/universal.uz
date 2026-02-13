/**
 * Fix overpaid debts in database
 * This script finds and fixes debts where paidAmount > amount
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Debt = require('../src/models/Debt');
const Customer = require('../src/models/Customer');

async function fixOverpaidDebts() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all debts where paidAmount > amount
    const overpaidDebts = await Debt.find({
      $expr: { $gt: ['$paidAmount', '$amount'] }
    }).populate('customer', 'name');

    console.log(`\n📊 Found ${overpaidDebts.length} overpaid debts\n`);

    if (overpaidDebts.length === 0) {
      console.log('✅ No overpaid debts found!');
      process.exit(0);
    }

    let fixedCount = 0;
    let totalOverpayment = 0;

    for (const debt of overpaidDebts) {
      const overpayment = debt.paidAmount - debt.amount;
      totalOverpayment += overpayment;

      console.log(`\n❌ Overpaid Debt:`);
      console.log(`   ID: ${debt._id}`);
      console.log(`   Customer: ${debt.customer?.name || 'Unknown'}`);
      console.log(`   Amount: ${debt.amount.toLocaleString()} so'm`);
      console.log(`   Paid: ${debt.paidAmount.toLocaleString()} so'm`);
      console.log(`   Overpayment: ${overpayment.toLocaleString()} so'm`);
      console.log(`   Status: ${debt.status}`);

      // Fix: Set paidAmount = amount and status = 'paid'
      debt.paidAmount = debt.amount;
      debt.status = 'paid';
      await debt.save();

      console.log(`   ✅ Fixed: paidAmount set to ${debt.amount.toLocaleString()}, status = 'paid'`);
      fixedCount++;
    }

    console.log(`\n✅ Fixed ${fixedCount} overpaid debts`);
    console.log(`💰 Total overpayment corrected: ${totalOverpayment.toLocaleString()} so'm`);

    // Now fix fully paid debts that have status != 'paid'
    console.log('\n🔧 Checking for fully paid debts with wrong status...');
    
    const fullyPaidDebts = await Debt.find({
      $expr: { $gte: ['$paidAmount', '$amount'] },
      status: { $ne: 'paid' }
    }).populate('customer', 'name');

    console.log(`📊 Found ${fullyPaidDebts.length} fully paid debts with wrong status\n`);

    let statusFixedCount = 0;
    for (const debt of fullyPaidDebts) {
      console.log(`\n⚠️  Fully Paid Debt with wrong status:`);
      console.log(`   ID: ${debt._id}`);
      console.log(`   Customer: ${debt.customer?.name || 'Unknown'}`);
      console.log(`   Amount: ${debt.amount.toLocaleString()} so'm`);
      console.log(`   Paid: ${debt.paidAmount.toLocaleString()} so'm`);
      console.log(`   Status: ${debt.status} → 'paid'`);

      debt.status = 'paid';
      await debt.save();

      console.log(`   ✅ Status updated to 'paid'`);
      statusFixedCount++;
    }

    console.log(`\n✅ Fixed ${statusFixedCount} debt statuses`);
    console.log('\n🎉 All done!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOverpaidDebts();
