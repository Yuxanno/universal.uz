// Test script to check inventory
const mongoose = require('mongoose');
const WarehouseInventory = require('./src/models/WarehouseInventory');
const Warehouse = require('./src/models/Warehouse');
const Product = require('./src/models/Product');

// Load .env from server directory
require('dotenv').config({ path: __dirname + '/.env' });

async function testInventory() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/universal-uz';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all warehouses
    const warehouses = await Warehouse.find({});
    console.log('📦 WAREHOUSES:');
    warehouses.forEach(w => {
      console.log(`  - ${w.name} (${w.isMain ? 'MAIN' : 'SUB'}) - ID: ${w._id}`);
    });

    // Get all inventory
    const inventory = await WarehouseInventory.find({})
      .populate('product')
      .populate('warehouse');
    
    console.log('\n📊 INVENTORY:');
    inventory.forEach(inv => {
      if (inv.product && inv.warehouse) {
        console.log(`  - ${inv.warehouse.name}: ${inv.product.name} = ${inv.quantity} dona`);
      }
    });

    // Get main warehouse inventory
    const mainWarehouse = warehouses.find(w => w.isMain);
    if (mainWarehouse) {
      console.log(`\n🏢 ASOSIY OMBOR (${mainWarehouse.name}):`);
      const mainInventory = await WarehouseInventory.find({ warehouse: mainWarehouse._id })
        .populate('product');
      
      mainInventory.forEach(inv => {
        if (inv.product) {
          console.log(`  - ${inv.product.name} (${inv.product.code}): ${inv.quantity} dona`);
        }
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

testInventory();
