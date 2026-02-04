require('dotenv').config();
const mongoose = require('mongoose');
const Debt = require('../src/models/Debt');

async function createIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create indexes for better query performance
    await Debt.collection.createIndex({ customer: 1, type: 1 });
    console.log('✅ Created index: customer + type');

    await Debt.collection.createIndex({ status: 1, type: 1 });
    console.log('✅ Created index: status + type');

    await Debt.collection.createIndex({ dueDate: 1, status: 1 });
    console.log('✅ Created index: dueDate + status');

    await Debt.collection.createIndex({ type: 1, status: 1, customer: 1 });
    console.log('✅ Created compound index: type + status + customer');

    await Debt.collection.createIndex({ createdAt: -1 });
    console.log('✅ Created index: createdAt (descending)');

    console.log('\n🎉 All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createIndexes();
