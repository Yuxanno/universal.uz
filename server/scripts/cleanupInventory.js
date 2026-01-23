/**
 * Cleanup Inventory - Remove orphaned inventory records
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function cleanupInventory() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_uz';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected\n');

    // Get all products
    const allProducts = await Product.find({});
    const productIds = new Set(allProducts.map(p => p._id.toString()));
    console.log(`📦 Total products: ${allProducts.length}`);

    // Get all inventory records
    const allInventory = await WarehouseInventory.find({});
    console.log(`📊 Total inventory records: ${allInventory.length}\n`);

    // Find orphaned inventory (inventory without product)
    const orphanedInventory = allInventory.filter(inv => 
      !productIds.has(inv.product.toString())
    );

    console.log(`⚠️  Orphaned inventory records: ${orphanedInventory.length}`);

    if (orphanedInventory.length > 0) {
      console.log('\nOrphaned inventory records:');
      for (const inv of orphanedInventory) {
        console.log(`  - Inventory ID: ${inv._id}, Product ID: ${inv.product}`);
      }
      
      console.log('\n⚠️  WARNING: These inventory records will be deleted.');
      console.log('To proceed, run this script with --confirm flag:');
      console.log('  node server/scripts/cleanupInventory.js --confirm');
      
      const confirmed = process.argv.includes('--confirm');
      
      if (!confirmed) {
        console.log('\n❌ Not confirmed. Exiting...');
        return;
      }

      console.log('\n✅ Confirmed. Deleting orphaned inventory...\n');

      let deleted = 0;
      for (const inv of orphanedInventory) {
        try {
          await WarehouseInventory.findByIdAndDelete(inv._id);
          deleted++;
          console.log(`  ✅ Deleted inventory ${inv._id}`);
        } catch (err) {
          console.log(`  ❌ Failed to delete ${inv._id}: ${err.message}`);
        }
      }

      console.log('');
      console.log('='.repeat(60));
      console.log(`✅ Deleted ${deleted} orphaned inventory records`);
      console.log('='.repeat(60));
    } else {
      console.log('\n✅ No orphaned inventory records found!');
    }

    // Find duplicate inventory (multiple inventory for same product+warehouse)
    console.log('\n🔍 Checking for duplicate inventory...\n');
    
    const duplicates = await WarehouseInventory.aggregate([
      {
        $group: {
          _id: { product: '$product', warehouse: '$warehouse' },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`⚠️  Duplicate inventory groups: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log('\nDuplicate inventory:');
      for (const dup of duplicates) {
        console.log(`  - Product: ${dup._id.product}, Warehouse: ${dup._id.warehouse}, Count: ${dup.count}`);
        console.log(`    IDs: ${dup.ids.join(', ')}`);
      }
      
      console.log('\n💡 You should manually review and merge these duplicates.');
    } else {
      console.log('✅ No duplicate inventory found!');
    }

    // Final summary
    const finalInventoryCount = await WarehouseInventory.countDocuments();
    const finalProductsWithInventory = await WarehouseInventory.find({}).distinct('product');
    
    console.log('');
    console.log('='.repeat(60));
    console.log('FINAL SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total products: ${allProducts.length}`);
    console.log(`Products with inventory: ${finalProductsWithInventory.length}`);
    console.log(`Total inventory records: ${finalInventoryCount}`);
    console.log('='.repeat(60));

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run
cleanupInventory();
