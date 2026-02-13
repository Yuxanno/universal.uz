/**
 * Check debt mismatch between Customer.debt and Debts collection
 * This script compares customer debt field with actual debt records
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Debt = require('../src/models/Debt');
const Customer = require('../src/models/Customer');

async function checkDebtMismatch() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all customers with debt
    const customers = await Customer.find({ debt: { $gt: 0 } });
    console.log(`📊 Found ${customers.length} customers with debt\n`);

    let mismatchCount = 0;
    let totalMismatch = 0;

    for (const customer of customers) {
      // Calculate actual debt from Debts collection
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

      const customerDebt = customer.debt;
      const difference = customerDebt - actualDebt;

      if (Math.abs(difference) > 1) { // Allow 1 so'm rounding error
        mismatchCount++;
        totalMismatch += Math.abs(difference);

        console.log(`\n❌ MISMATCH FOUND:`);
        console.log(`   Customer: ${customer.name}`);
        console.log(`   Phone: ${customer.phone}`);
        console.log(`   Customer.debt: ${customerDebt.toLocaleString()} so'm`);
        console.log(`   Actual debt (from Debts): ${actualDebt.toLocaleString()} so'm`);
        console.log(`   Difference: ${difference.toLocaleString()} so'm`);
        console.log(`   Debts count: ${debts.length}`);

        // Show debt details
        console.log(`\n   📋 Debt details:`);
        for (const debt of debts) {
          const remaining = debt.amount - debt.paidAmount;
          console.log(`      - Amount: ${debt.amount.toLocaleString()}, Paid: ${debt.paidAmount.toLocaleString()}, Remaining: ${remaining.toLocaleString()}, Status: ${debt.status}`);
        }
      } else {
        console.log(`✅ ${customer.name}: ${customerDebt.toLocaleString()} so'm (matched)`);
      }
    }

    console.log(`\n\n📊 SUMMARY:`);
    console.log(`   Total customers checked: ${customers.length}`);
    console.log(`   Mismatches found: ${mismatchCount}`);
    console.log(`   Total mismatch amount: ${totalMismatch.toLocaleString()} so'm`);

    if (mismatchCount > 0) {
      console.log(`\n⚠️  Run 'node scripts/fix-customer-debts.js' to fix these mismatches`);
    } else {
      console.log(`\n✅ All customer debts are in sync!`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDebtMismatch();
