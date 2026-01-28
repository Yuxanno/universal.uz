const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Receipt = require('../src/models/Receipt');

async function cleanupEmptyDrafts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all draft receipts with no items or empty items array
    const emptyDrafts = await Receipt.find({
      status: 'draft',
      $or: [
        { items: { $exists: false } },
        { items: { $size: 0 } }
      ]
    });

    console.log(`📋 Found ${emptyDrafts.length} empty draft receipts`);

    if (emptyDrafts.length > 0) {
      // Delete all empty drafts
      const result = await Receipt.deleteMany({
        status: 'draft',
        $or: [
          { items: { $exists: false } },
          { items: { $size: 0 } }
        ]
      });

      console.log(`🗑️  Deleted ${result.deletedCount} empty draft receipts`);
    } else {
      console.log('✨ No empty drafts found');
    }

    await mongoose.disconnect();
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupEmptyDrafts();
