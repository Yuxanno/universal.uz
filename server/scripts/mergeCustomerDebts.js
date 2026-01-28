const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Debt = require('../src/models/Debt');
const Customer = require('../src/models/Customer');

async function mergeCustomerDebts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all customers who have debts
    const customersWithDebts = await Debt.aggregate([
      {
        $match: {
          type: 'receivable',
          status: { $in: ['pending', 'overdue'] }
        }
      },
      {
        $group: {
          _id: '$customer',
          debts: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 } // Only customers with multiple debts
        }
      }
    ]);

    console.log(`Found ${customersWithDebts.length} customers with multiple debts`);

    for (const customerGroup of customersWithDebts) {
      const customerId = customerGroup._id;
      const debts = customerGroup.debts;

      // Get customer info
      const customer = await Customer.findById(customerId);
      if (!customer) {
        console.log(`Customer ${customerId} not found, skipping...`);
        continue;
      }

      console.log(`\nMerging debts for: ${customer.name}`);
      console.log(`  Found ${debts.length} separate debts`);

      // Calculate totals
      let totalAmount = 0;
      let totalPaid = 0;
      const descriptions = [];
      const debtIds = [];

      debts.forEach(debt => {
        totalAmount += debt.amount;
        totalPaid += debt.paidAmount || 0;
        if (debt.description) {
          descriptions.push(debt.description);
        }
        debtIds.push(debt._id);
      });

      console.log(`  Total amount: ${totalAmount}`);
      console.log(`  Total paid: ${totalPaid}`);
      console.log(`  Remaining: ${totalAmount - totalPaid}`);

      // Keep the first debt and update it
      const primaryDebt = debts[0];
      await Debt.findByIdAndUpdate(primaryDebt._id, {
        amount: totalAmount,
        paidAmount: totalPaid,
        description: descriptions.join('\n\n'),
        status: totalPaid >= totalAmount ? 'paid' : (primaryDebt.dueDate && new Date(primaryDebt.dueDate) < new Date() ? 'overdue' : 'pending')
      });

      console.log(`  Updated primary debt: ${primaryDebt._id}`);

      // Delete other debts
      const otherDebtIds = debtIds.slice(1);
      if (otherDebtIds.length > 0) {
        await Debt.deleteMany({ _id: { $in: otherDebtIds } });
        console.log(`  Deleted ${otherDebtIds.length} duplicate debts`);
      }

      // Verify customer debt amount matches
      const remainingDebt = totalAmount - totalPaid;
      if (customer.debt !== remainingDebt) {
        console.log(`  Fixing customer debt: ${customer.debt} -> ${remainingDebt}`);
        await Customer.findByIdAndUpdate(customerId, { debt: remainingDebt });
      }
    }

    console.log('\n✅ Debt merge completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error merging debts:', error);
    process.exit(1);
  }
}

mergeCustomerDebts();
