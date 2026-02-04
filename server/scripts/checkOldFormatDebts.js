const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Debt = require('../src/models/Debt');
const Customer = require('../src/models/Customer');

async function checkOldFormatDebts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Find all debts with old format descriptions
    const debts = await Debt.find({
      type: 'receivable',
      description: { $regex: /Savdo cheki #|Pocco pampers/ }
    }).populate('customer');

    console.log(`\n📊 Found ${debts.length} debts with old format\n`);

    for (const debt of debts) {
      console.log(`\n🔍 Debt ID: ${debt._id}`);
      console.log(`   Customer: ${debt.customer?.name || 'Unknown'}`);
      console.log(`   Amount: ${debt.amount.toLocaleString()} so'm`);
      console.log(`   Paid: ${debt.paidAmount.toLocaleString()} so'm`);
      console.log(`   Status: ${debt.status}`);
      console.log(`   Description:\n${debt.description}`);
      console.log(`   ---`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkOldFormatDebts();
