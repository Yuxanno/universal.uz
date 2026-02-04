const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Debt = require('../src/models/Debt');
const Customer = require('../src/models/Customer');

async function splitCombinedDebts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Find all debts with descriptions containing multiple transactions
    const debts = await Debt.find({
      type: 'receivable',
      description: { $exists: true, $ne: '' }
    }).populate('customer');

    console.log(`📊 Found ${debts.length} debts to check`);

    let splitCount = 0;
    let skippedCount = 0;

    for (const debt of debts) {
      // Check if description contains multiple transactions (separated by \n\n)
      const transactions = debt.description.split('\n\n').filter(t => t.trim());
      
      if (transactions.length <= 1) {
        skippedCount++;
        continue;
      }

      console.log(`\n🔍 Processing debt ${debt._id} with ${transactions.length} transactions`);
      console.log(`   Customer: ${debt.customer?.name || 'Unknown'}`);

      // Parse each transaction and create separate debts
      const newDebts = [];
      
      for (const transaction of transactions) {
        // Skip empty or very short transactions
        if (transaction.trim().length < 10) {
          continue;
        }

        // Extract amount from transaction description
        // Format: "DD.MM.YYYY HH:MM sanada ... Qarzga qolgan: XXX so'm."
        const amountMatch = transaction.match(/Qarzga qolgan:\s*([\d\s]+)\s*so'm/);
        const dateMatch = transaction.match(/^(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2})/);
        
        if (!amountMatch) {
          console.log(`   ⚠️ Could not extract amount from: ${transaction.substring(0, 50)}...`);
          continue;
        }

        const amount = parseInt(amountMatch[1].replace(/\s/g, ''));
        const dateStr = dateMatch ? dateMatch[1] : null;
        
        // Parse date if available
        let createdAt = new Date();
        if (dateStr) {
          const [datePart, timePart] = dateStr.split(' ');
          const [day, month, year] = datePart.split('.');
          const [hours, minutes] = timePart.split(':');
          createdAt = new Date(year, month - 1, day, hours, minutes);
        }

        newDebts.push({
          type: 'receivable',
          customer: debt.customer._id,
          amount: amount,
          paidAmount: 0,
          status: debt.status,
          description: transaction.trim(),
          receipt: debt.receipt,
          dueDate: debt.dueDate,
          createdBy: debt.createdBy,
          createdAt: createdAt,
          updatedAt: createdAt
        });

        console.log(`   ✅ Extracted: ${amount.toLocaleString()} so'm (${dateStr || 'no date'})`);
      }

      if (newDebts.length > 0) {
        // Create new separate debts
        await Debt.insertMany(newDebts);
        console.log(`   ✅ Created ${newDebts.length} separate debts`);

        // Delete the old combined debt
        await Debt.findByIdAndDelete(debt._id);
        console.log(`   🗑️ Deleted old combined debt`);

        splitCount++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Split: ${splitCount} combined debts`);
    console.log(`   Skipped: ${skippedCount} single-transaction debts`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

splitCombinedDebts();
