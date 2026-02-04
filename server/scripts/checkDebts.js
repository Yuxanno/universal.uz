const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Debt = require('../src/models/Debt');
const Customer = require('../src/models/Customer');

async function checkDebtsByStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Count debts by status
    const pending = await Debt.countDocuments({ type: 'receivable', status: 'pending' });
    const overdue = await Debt.countDocuments({ type: 'receivable', status: 'overdue' });
    const paid = await Debt.countDocuments({ type: 'receivable', status: 'paid' });
    
    console.log(`\n📊 Receivable debts by status:`);
    console.log(`   Pending: ${pending}`);
    console.log(`   Overdue: ${overdue}`);
    console.log(`   Paid: ${paid}`);
    console.log(`   Total: ${pending + overdue + paid}`);

    // Get sample pending debts
    const pendingDebts = await Debt.find({ type: 'receivable', status: 'pending' })
      .populate('customer', 'name phone')
      .limit(3);

    console.log(`\n📋 Sample pending debts:`);
    for (const debt of pendingDebts) {
      console.log(`   - ${debt.customer?.name || 'No customer'}: ${debt.amount.toLocaleString()} so'm`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkDebtsByStatus();
