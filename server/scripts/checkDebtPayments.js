const mongoose = require('mongoose');
require('dotenv').config();

const Debt = require('../src/models/Debt');
const Customer = require('../src/models/Customer'); // Import Customer model

async function checkDebtPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check the specific debt that was paid
    const debtId = '697cd4d532ecfc1a98da0562';
    const debt = await Debt.findById(debtId).populate('customer', 'name');

    if (!debt) {
      console.log('❌ Debt not found');
      return;
    }

    console.log('\n📋 Debt Details:');
    console.log('Customer:', debt.customer?.name);
    console.log('Amount:', debt.amount);
    console.log('Paid Amount:', debt.paidAmount);
    console.log('Status:', debt.status);
    console.log('Created:', debt.createdAt);
    
    console.log('\n💰 Payments:');
    if (debt.payments && debt.payments.length > 0) {
      debt.payments.forEach((payment, index) => {
        console.log(`\n  Payment ${index + 1}:`);
        console.log('    Amount:', payment.amount);
        console.log('    Method:', payment.method);
        console.log('    Source:', payment.source || 'manual');
        console.log('    Date:', payment.date);
      });
    } else {
      console.log('  No payments found');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDebtPayments();
