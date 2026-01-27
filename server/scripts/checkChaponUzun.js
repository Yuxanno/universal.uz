require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function checkChaponUzun() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get Product model
    const Product = require('../src/models/Product');
    const WarehouseInventory = require('../src/models/WarehouseInventory');
    const Warehouse = require('../src/models/Warehouse');

    // Find chapon uzun in Product model
    const product = await Product.findOne({ code: '1095' });
    console.log('\n📦 Product Model (code: 1095):');
    if (product) {
      console.log('  Name:', product.name);
      console.log('  Quantity:', product.quantity);
      console.log('  Warehouse:', product.warehouse);
    } else {
      console.log('  ❌ Not found');
    }

    // Find main warehouse
    const mainWarehouse = await Warehouse.findOne({ name: 'Asosiy ombor' });
    console.log('\n🏢 Main Warehouse:');
    if (mainWarehouse) {
      console.log('  ID:', mainWarehouse._id);
      console.log('  Name:', mainWarehouse.name);
    }

    // Find chapon uzun in WarehouseInventory
    if (product && mainWarehouse) {
      const inventory = await WarehouseInventory.findOne({ 
        product: product._id,
        warehouse: mainWarehouse._id 
      });
      console.log('\n📊 WarehouseInventory (product: chapon uzun, warehouse: Asosiy ombor):');
      if (inventory) {
        console.log('  Quantity:', inventory.quantity);
        console.log('  MinStock:', inventory.minStock);
      } else {
        console.log('  ❌ Not found');
      }

      // Check all inventory records for this product
      const allInventories = await WarehouseInventory.find({ product: product._id })
        .populate('warehouse', 'name');
      console.log('\n📋 All Inventory Records for this product:');
      allInventories.forEach(inv => {
        console.log(`  - ${inv.warehouse?.name || 'Unknown'}: ${inv.quantity} ta`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkChaponUzun();
