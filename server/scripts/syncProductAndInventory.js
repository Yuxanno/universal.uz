require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function syncProductAndInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Product = require('../src/models/Product');
    const WarehouseInventory = require('../src/models/WarehouseInventory');
    const Warehouse = require('../src/models/Warehouse');

    // Get main warehouse
    const mainWarehouse = await Warehouse.findOne({ name: 'Asosiy ombor' });
    if (!mainWarehouse) {
      console.error('❌ Main warehouse not found');
      process.exit(1);
    }

    console.log('🔄 Syncing Product and WarehouseInventory...\n');

    // Get all products
    const products = await Product.find({ warehouse: mainWarehouse._id });
    console.log(`Found ${products.length} products in main warehouse\n`);

    let synced = 0;
    let errors = 0;

    for (const product of products) {
      try {
        // Find inventory record
        const inventory = await WarehouseInventory.findOne({
          product: product._id,
          warehouse: mainWarehouse._id
        });

        if (inventory) {
          if (inventory.quantity !== product.quantity) {
            console.log(`📦 ${product.code} - ${product.name}`);
            console.log(`   Product: ${product.quantity}, Inventory: ${inventory.quantity}`);
            
            // Use Product quantity as source of truth (it's updated by receipts)
            inventory.quantity = product.quantity;
            await inventory.save();
            
            console.log(`   ✅ Synced to: ${product.quantity}\n`);
            synced++;
          }
        } else {
          console.log(`⚠️  ${product.code} - ${product.name}: No inventory record`);
        }
      } catch (err) {
        console.error(`❌ Error syncing ${product.code}:`, err.message);
        errors++;
      }
    }

    console.log(`\n✅ Sync complete: ${synced} products synced, ${errors} errors`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

syncProductAndInventory();
