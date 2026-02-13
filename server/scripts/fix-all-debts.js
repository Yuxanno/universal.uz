/**
 * Master script to fix all debt-related issues
 * 
 * This script runs all debt fixing scripts in the correct order:
 * 1. Fix overpaid debts
 * 2. Fix customer debt totals
 * 3. Check for any remaining mismatches
 * 
 * Run: node server/scripts/fix-all-debts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Debt = require('../src/models/Debt');
const Customer = require('../src/models/Customer');

async function fixAllDebts() {
  try {
    console.log('🔧 DEBT FIXING MASTER SCRIPT');
    console.log('=' .repeat(50));
    console.log('\n🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // STEP 1: Fix overpaid debts
    console.log('\n📋 STEP 1: Fixing overpaid debts...');
    console.log('=' .repeat(50));
    
    const overpaidDebts = await Debt.find({
      $expr: { $gt: ['$paidAmount', '$amount'] }
    }).populate('customer', 'name');

    console.log(`Found ${overpaidDebts.length} overpaid debts`);

    let overpaidFixed = 0;
    for (const debt of overpaidDebts) {
      const overpayment = debt.paidAmount - debt.amount;
      console.log(`\n❌ Overpaid: ${debt.customer?.name || 'Unknown'}`);
      console.log(`   Amount: ${debt.amount.toLocaleString()}, Paid: ${debt.paidAmount.toLocaleString()}, Over: ${overpayment.toLocaleString()}`);
      
      debt.paidAmount = debt.amount;
      debt.status = 'paid';
      await debt.save();
      overpaidFixed++;
      console.log(`   ✅ Fixed`);
    }

    // STEP 2: Fix fully paid debts with wrong status
    console.log('\n\n📋 STEP 2: Fixing fully paid debts with wrong status...');
    console.log('=' .repeat(50));
    
    const fullyPaidDebts = await Debt.find({
      $expr: { $gte: ['$paidAmount', '$amount'] },
      status: { $ne: 'paid' }
    }).populate('customer', 'name');

    console.log(`Found ${fullyPaidDebts.length} fully paid debts with wrong status`);

    let statusFixed = 0;
    for (const debt of fullyPaidDebts) {
      console.log(`\n⚠️  ${debt.customer?.name || 'Unknown'}: ${debt.status} → paid`);
      debt.status = 'paid';
      await debt.save();
      statusFixed++;
    }

    // STEP 3: Recalculate customer debts
    console.log('\n\n📋 STEP 3: Recalculating customer debts...');
    console.log('=' .repeat(50));
    
    const customers = await Customer.find({});
    console.log(`Found ${customers.length} customers`);

    let customerFixed = 0;
    let totalMismatch = 0;

    for (const customer of customers) {
      const debts = await Debt.find({
        customer: customer._id,
        type: 'receivable',
        status: { $ne: 'paid' }
      });

      let actualDebt = 0;
      for (const debt of debts) {
        const remaining = debt.amount - debt.paidAmount;
        if (remaining > 0) {
          actualDebt += remaining;
        }
      }

      const difference = Math.abs(customer.debt - actualDebt);
      
      if (difference > 1) { // Allow 1 so'm rounding error
        console.log(`\n🔧 ${customer.name}`);
        console.log(`   Current: ${customer.debt.toLocaleString()} so'm`);
        console.log(`   Actual:  ${actualDebt.toLocaleString()} so'm`);
        console.log(`   Diff:    ${difference.toLocaleString()} so'm`);
        
        customer.debt = actualDebt;
        await customer.save();
        customerFixed++;
        totalMismatch += difference;
        console.log(`   ✅ Fixed`);
      }
    }

    // STEP 4: Final verification
    console.log('\n\n📋 STEP 4: Final verification...');
    console.log('=' .repeat(50));
    
    const remainingMismatches = await Customer.find({}).then(async customers => {
      let count = 0;
      for (const customer of customers) {
        const debts = await Debt.find({
          customer: customer._id,
          type: 'receivable',
          status: { $ne: 'paid' }
        });

        let actualDebt = 0;
        for (const debt of debts) {
          const remaining = debt.amount - debt.paidAmount;
          if (remaining > 0) actualDebt += remaining;
        }

        if (Math.abs(customer.debt - actualDebt) > 1) count++;
      }
      return count;
    });

    // SUMMARY
    console.log('\n\n📊 SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ Overpaid debts fixed: ${overpaidFixed}`);
    console.log(`✅ Debt statuses fixed: ${statusFixed}`);
    console.log(`✅ Customer debts fixed: ${customerFixed}`);
    console.log(`💰 Total mismatch corrected: ${totalMismatch.toLocaleString()} so'm`);
    console.log(`📋 Remaining mismatches: ${remainingMismatches}`);
    
    if (remainingMismatches === 0) {
      console.log('\n🎉 All debts are now in sync!');
    } else {
      console.log('\n⚠️  Some mismatches remain. Please investigate manually.');
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixAllDebts();
