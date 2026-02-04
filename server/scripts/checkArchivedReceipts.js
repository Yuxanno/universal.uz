const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Receipt = require('../src/models/Receipt');
const User = require('../src/models/User');

async function checkArchivedReceipts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Find all archived receipts
    const archived = await Receipt.find({ status: 'archived' })
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    console.log(`\n📊 Found ${archived.length} archived receipts\n`);

    for (const receipt of archived) {
      console.log(`📦 Receipt ID: ${receipt._id}`);
      console.log(`   Status: ${receipt.status}`);
      console.log(`   Created by: ${receipt.createdBy?.name || 'Unknown'} (${receipt.createdBy?.role || 'N/A'})`);
      console.log(`   Items: ${receipt.items.length}`);
      console.log(`   Total: ${receipt.total.toLocaleString()} so'm`);
      console.log(`   Created: ${receipt.createdAt}`);
      console.log(`   ---`);
    }

    // Find all draft and pending receipts
    const active = await Receipt.find({ status: { $in: ['draft', 'pending'] } })
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    console.log(`\n📊 Found ${active.length} active receipts (draft/pending)\n`);

    for (const receipt of active) {
      console.log(`📦 Receipt ID: ${receipt._id}`);
      console.log(`   Status: ${receipt.status}`);
      console.log(`   Created by: ${receipt.createdBy?.name || 'Unknown'} (${receipt.createdBy?.role || 'N/A'})`);
      console.log(`   Items: ${receipt.items.length}`);
      console.log(`   Total: ${receipt.total.toLocaleString()} so'm`);
      console.log(`   Created: ${receipt.createdAt}`);
      console.log(`   ---`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkArchivedReceipts();
