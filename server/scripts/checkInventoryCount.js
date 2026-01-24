const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function checkInventoryCount() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const mainWarehouse = await Warehouse.findOne({ name: 'Asosiy ombor' });
    const productCount = await Product.countDocuments({ warehouse: mainWarehouse._id });
    const inventoryCount = await WarehouseInventory.countDocuments({ warehouse: mainWarehouse._id });
    
    console.log('\n📊 INVENTORY STATUS:\n');
    console.log(`🏢 Warehouse: ${mainWarehouse.name}`);
    console.log(`📦 Products: ${productCount}`);
    console.log(`📋 Inventory records: ${inventoryCount}`);
    console.log(`${productCount === inventoryCount ? '✅' : '❌'} Match: ${productCount === inventoryCount ? 'YES' : 'NO'}`);
    
    if (productCount !== inventoryCount) {
      console.log(`\n⚠️  Missing ${productCount - inventoryCount} inventory records`);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkInventoryCount();
