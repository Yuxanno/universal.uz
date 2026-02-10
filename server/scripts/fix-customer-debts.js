/**
 * Script to fix customer debt inconsistencies
 * 
 * This script recalculates customer debt based on actual Debt records
 * and updates the Customer.debt field accordingly.
 * 
 * Run: node server/scripts/fix-customer-debts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../src/models/Customer');
const Debt = require('../src/models/Debt');

async function fixCustomerDebts() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get all customers
    const customers = await Customer.find({});
    console.log(`📊 Found ${customers.length} customers\n`);

    let fixedCount = 0;
    let inconsistentCustomers = [];

    for (const customer of customers) {
      // Calculate actual debt from Debt records
      const debts = await Debt.find({
        customer: customer._id,
        type: 'receivable'
      });

      let actualDebt = 0;
      for (const debt of debts) {
        const remaining = debt.amount - debt.paidAmount;
        if (remaining > 0) {
          actualDebt += remaining;
        }
      }

      // Check if customer.debt matches actual debt
      if (customer.debt !== actualDebt) {
        inconsistentCustomers.push({
          name: customer.name,
          phone: customer.phone,
          currentDebt: customer.debt,
          actualDebt: actualDebt,
          difference: customer.debt - actualDebt
        });

        // Update customer debt
        customer.debt = actualDebt;
        await customer.save();
        fixedCount++;

        console.log(`🔧 Fixed: ${customer.name}`);
        console.log(`   Current: ${customer.debt.toLocaleString()} so'm`);
        console.log(`   Actual:  ${actualDebt.toLocaleString()} so'm`);
        console.log(`   Diff:    ${(customer.debt - actualDebt).toLocaleString()} so'm\n`);
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   Total customers: ${customers.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Consistent: ${customers.length - fixedCount}\n`);

    if (inconsistentCustomers.length > 0) {
      console.log('❌ Inconsistent customers:');
      inconsistentCustomers.forEach(c => {
        console.log(`   - ${c.name} (${c.phone}): ${c.currentDebt.toLocaleString()} → ${c.actualDebt.toLocaleString()} so'm`);
      });
    } else {
      console.log('✅ All customer debts are consistent!');
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCustomerDebts();
