/**
 * Script to find and remove duplicate products
 * This will keep the oldest product and remove newer duplicates
 * 
 * Usage: node server/scripts/findAndRemoveDuplicates.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-system';

async function findAndRemoveDuplicates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    // Find duplicates by name (case-insensitive)
    console.log('\n🔍 Searching for duplicate products by name...');
    const duplicatesByName = await productsCollection.aggregate([
      {
        $group: {
          _id: { $toLower: '$name' },
          count: { $sum: 1 },
          docs: { 
            $push: { 
              _id: '$_id', 
              name: '$name', 
              code: '$code',
              quantity: '$quantity',
              createdAt: '$createdAt'
            } 
          }
        }
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    if (duplicatesByName.length === 0) {
      console.log('✅ No duplicate products found by name!');
    } else {
      console.log(`\n⚠️  Found ${duplicatesByName.length} duplicate product names:\n`);
      
      let totalDuplicates = 0;
      let totalToRemove = 0;

      duplicatesByName.forEach((dup, index) => {
        console.log(`${index + 1}. "${dup._id}" (${dup.count} copies):`);
        
        // Sort by creation date (oldest first)
        const sortedDocs = dup.docs.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );

        sortedDocs.forEach((doc, docIndex) => {
          const marker = docIndex === 0 ? '✅ KEEP' : '❌ REMOVE';
          console.log(`   ${marker} - ID: ${doc._id}`);
          console.log(`           Code: ${doc.code}, Qty: ${doc.quantity}`);
          console.log(`           Created: ${new Date(doc.createdAt).toLocaleString()}`);
        });
        console.log('');

        totalDuplicates += dup.count;
        totalToRemove += (dup.count - 1);
      });

      console.log(`📊 Summary:`);
      console.log(`   Total duplicate products: ${totalDuplicates}`);
      console.log(`   Products to keep: ${duplicatesByName.length}`);
      console.log(`   Products to remove: ${totalToRemove}`);

      // Ask for confirmation
      console.log('\n⚠️  WARNING: This will permanently delete duplicate products!');
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('🗑️  Removing duplicates...\n');

      let removedCount = 0;

      for (const dup of duplicatesByName) {
        // Sort by creation date (oldest first)
        const sortedDocs = dup.docs.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );

        // Keep the first (oldest), remove the rest
        const toRemove = sortedDocs.slice(1);

        for (const doc of toRemove) {
          const result = await productsCollection.deleteOne({ _id: doc._id });
          if (result.deletedCount > 0) {
            console.log(`   ✅ Removed: ${doc.name} (Code: ${doc.code}, ID: ${doc._id})`);
            removedCount++;
          }
        }
      }

      console.log(`\n✅ Successfully removed ${removedCount} duplicate products!`);
    }

    // Find duplicates by code
    console.log('\n🔍 Searching for duplicate products by code...');
    const duplicatesByCode = await productsCollection.aggregate([
      {
        $group: {
          _id: '$code',
          count: { $sum: 1 },
          docs: { 
            $push: { 
              _id: '$_id', 
              name: '$name', 
              code: '$code',
              createdAt: '$createdAt'
            } 
          }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (duplicatesByCode.length === 0) {
      console.log('✅ No duplicate products found by code!');
    } else {
      console.log(`\n⚠️  Found ${duplicatesByCode.length} duplicate product codes:`);
      duplicatesByCode.forEach(dup => {
        console.log(`\n   Code: "${dup._id}" (${dup.count} copies)`);
        dup.docs.forEach(doc => {
          console.log(`      - ${doc.name} (ID: ${doc._id})`);
        });
      });
      console.log('\n⚠️  Please manually review and fix duplicate codes!');
    }

    console.log('\n✅ Duplicate check completed!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
findAndRemoveDuplicates();
