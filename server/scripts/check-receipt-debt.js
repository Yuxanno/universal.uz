/**
 * Check debt for a specific receipt
 * Usage: node server/scripts/check-receipt-debt.js <receiptId>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Debt = require('../src/models/Debt');
const Receipt = require('../src/models/Receipt');

async function checkReceiptDebt() {
  try {
    const receiptId = process.argv[2];
    
    if (!receiptId) {
      console.log('❌ Usage: node server/scripts/check-receipt-debt.js <receiptId>');
      process.exit(1);
    }
    
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');
    
    // Get receipt
    const receipt = await Receipt.findById(receiptId).populate('customer', 'name');
    if (!receipt) {
      console.log('❌ Receipt not found:', receiptId);
      process.exit(1);
    }
    
    console.log('📋 Receipt Info:');
    console.log('   ID:', receipt._id);
    console.log('   Customer:', receipt.customer?.name || 'Unknown');
    console.log('   Total:', receipt.total.toLocaleString(), 'so\'m');
    console.log('   Cash:', (receipt.cashAmount || 0).toLocaleString(), 'so\'m');
    console.log('   Card:', (receipt.cardAmount || 0).toLocaleString(), 'so\'m');
    console.log('   Debt:', (receipt.debtAmount || 0).toLocaleString(), 'so\'m');
    console.log('   Status:', receipt.status);
    console.log('   Date:', receipt.createdAt);
    
    // Find debts for this receipt
    console.log('\n💰 Debts for this receipt:');
    const debts = await Debt.find({ receipt: receiptId });
    
    if (debts.length === 0) {
      console.log('   ❌ No debts found for this receipt!');
      console.log('\n🔍 Searching for debts by customer and date...');
      
      // Try to find debts by customer and similar date
      const receiptDate = new Date(receipt.createdAt);
      const startDate = new Date(receiptDate.getTime() - 60000); // 1 minute before
      const endDate = new Date(receiptDate.getTime() + 60000); // 1 minute after
      
      const nearbyDebts = await Debt.find({
        customer: receipt.customer._id,
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      if (nearbyDebts.length > 0) {
        console.log(`   ✅ Found ${nearbyDebts.length} debt(s) created around the same time:`);
        nearbyDebts.forEach((debt, i) => {
          console.log(`\n   Debt ${i + 1}:`);
          console.log('      ID:', debt._id);
          console.log('      Amount:', debt.amount.toLocaleString(), 'so\'m');
          console.log('      Paid:', debt.paidAmount.toLocaleString(), 'so\'m');
          console.log('      Remaining:', (debt.amount - debt.paidAmount).toLocaleString(), 'so\'m');
          console.log('      Status:', debt.status);
          console.log('      Receipt:', debt.receipt || 'NOT SET');
          console.log('      Created:', debt.createdAt);
        });
      } else {
        console.log('   ❌ No debts found around this time either');
      }
    } else {
      console.log(`   ✅ Found ${debts.length} debt(s):\n`);
      debts.forEach((debt, i) => {
        console.log(`   Debt ${i + 1}:`);
        console.log('      ID:', debt._id);
        console.log('      Amount:', debt.amount.toLocaleString(), 'so\'m');
        console.log('      Paid:', debt.paidAmount.toLocaleString(), 'so\'m');
        console.log('      Remaining:', (debt.amount - debt.paidAmount).toLocaleString(), 'so\'m');
        console.log('      Status:', debt.status);
        console.log('      Created:', debt.createdAt);
        console.log('');
      });
    }
    
    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkReceiptDebt();
