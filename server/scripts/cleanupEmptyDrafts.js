const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const Receipt = require('../src/models/Receipt');

async function cleanupEmptyDrafts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all receipts with no items or empty items array (any status)
    const emptyReceipts = await Receipt.find({
      $or: [
        { items: { $exists: false } },
        { items: { $size: 0 } }
      ]
    });

    console.log(`📋 Found ${emptyReceipts.length} empty receipts`);

    if (emptyReceipts.length > 0) {
      // Show details
      emptyReceipts.forEach(receipt => {
        console.log(`  - ID: ${receipt._id}, Status: ${receipt.status}, Created: ${receipt.createdAt}`);
      });

      // Delete all empty receipts
      const result = await Receipt.deleteMany({
        $or: [
          { items: { $exists: false } },
          { items: { $size: 0 } }
        ]
      });

      console.log(`🗑️  Deleted ${result.deletedCount} empty receipts`);
    } else {
      console.log('✨ No empty receipts found');
    }

    await mongoose.disconnect();
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupEmptyDrafts();
