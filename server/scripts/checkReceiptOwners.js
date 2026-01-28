const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const Receipt = require('../src/models/Receipt');
const User = require('../src/models/User');

async function checkReceiptOwners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all receipts with status archived or pending
    const receipts = await Receipt.find({
      status: { $in: ['archived', 'pending', 'draft'] },
      'items.0': { $exists: true }
    })
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 });

    console.log(`\n📋 Found ${receipts.length} receipts:\n`);

    // Group by user
    const byUser = {};
    receipts.forEach(receipt => {
      const userId = receipt.createdBy?._id?.toString() || 'unknown';
      const userName = receipt.createdBy?.name || 'Unknown';
      
      if (!byUser[userId]) {
        byUser[userId] = {
          name: userName,
          receipts: []
        };
      }
      
      byUser[userId].receipts.push({
        id: receipt._id,
        status: receipt.status,
        itemsCount: receipt.items.length,
        createdAt: receipt.createdAt
      });
    });

    // Print grouped results
    Object.entries(byUser).forEach(([userId, data]) => {
      console.log(`👤 User: ${data.name} (ID: ${userId})`);
      console.log(`   Receipts: ${data.receipts.length}`);
      data.receipts.forEach(r => {
        console.log(`   - ${r.id} | ${r.status} | ${r.itemsCount} items | ${r.createdAt}`);
      });
      console.log('');
    });

    // Find Ozodbek user
    const ozodbek = await User.findOne({ name: /ozodbek/i });
    if (ozodbek) {
      console.log(`\n🔍 Ozodbek user found:`);
      console.log(`   ID: ${ozodbek._id}`);
      console.log(`   Name: ${ozodbek.name}`);
      console.log(`   Role: ${ozodbek.role}`);
      
      const ozodbekReceipts = receipts.filter(r => 
        r.createdBy?._id?.toString() === ozodbek._id.toString()
      );
      console.log(`   Receipts: ${ozodbekReceipts.length}`);
    } else {
      console.log(`\n❌ Ozodbek user not found`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkReceiptOwners();
