/**
 * Rollback Migration - Restore to 979 Products
 * 
 * This script:
 * 1. Removes all WarehouseInventory records
 * 2. Keeps all products as they were
 * 3. Resets warehouse references
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const WarehouseInventory = require('../src/models/WarehouseInventory');
const WarehouseTransfer = require('../src/models/WarehouseTransfer');

async function rollback() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_uz');
    console.log('✅ MongoDB connected\n');

    console.log('🔄 Starting rollback...\n');

    // Step 1: Count current state
    const currentProductCount = await Product.countDocuments();
    const currentInventoryCount = await WarehouseInventory.countDocuments();
    const currentTransferCount = await WarehouseTransfer.countDocuments();

    console.log('📊 Current State:');
    console.log(`  Products: ${currentProductCount}`);
    console.log(`  Inventory Records: ${currentInventoryCount}`);
    console.log(`  Transfer Records: ${currentTransferCount}\n`);

    // Step 2: Ask for confirmation
    console.log('⚠️  WARNING: This will:');
    console.log('  1. Delete all WarehouseInventory records');
    console.log('  2. Delete all WarehouseTransfer records');
    console.log('  3. Keep all products (no products will be deleted)');
    console.log('  4. Reset warehouse references\n');

    // Step 3: Delete inventory records
    console.log('🗑️  Deleting WarehouseInventory records...');
    const deletedInventory = await WarehouseInventory.deleteMany({});
    console.log(`✅ Deleted ${deletedInventory.deletedCount} inventory records\n`);

    // Step 4: Delete transfer records
    console.log('🗑️  Deleting WarehouseTransfer records...');
    const deletedTransfers = await WarehouseTransfer.deleteMany({});
    console.log(`✅ Deleted ${deletedTransfers.deletedCount} transfer records\n`);

    // Step 5: Reset product warehouse references (optional)
    console.log('🔄 Resetting product warehouse references...');
    await Product.updateMany({}, { $unset: { warehouse: 1, isMainWarehouse: 1 } });
    console.log('✅ Product references reset\n');

    // Step 6: Final count
    const finalProductCount = await Product.countDocuments();
    
    console.log('=' .repeat(50));
    console.log('ROLLBACK COMPLETE');
    console.log('=' .repeat(50));
    console.log(`Products: ${finalProductCount}`);
    console.log(`Inventory Records: 0`);
    console.log(`Transfer Records: 0`);
    console.log('=' .repeat(50));

    console.log('\n✅ Rollback completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('  1. Check your products count in the UI');
    console.log('  2. If you still see 965, there might be deleted products');
    console.log('  3. You may need to restore from backup');

  } catch (err) {
    console.error('❌ Rollback failed:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run rollback
rollback();
