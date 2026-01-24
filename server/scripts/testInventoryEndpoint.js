const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function testInventoryEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const mainWarehouse = await Warehouse.findOne({ name: 'Asosiy ombor' });
    console.log(`\n🏢 Testing inventory for: ${mainWarehouse.name}`);
    console.log(`   ID: ${mainWarehouse._id}\n`);
    
    // Simulate what the endpoint does
    const inventory = await WarehouseInventory.find({ warehouse: mainWarehouse._id })
      .populate('product')
      .populate('warehouse')
      .sort({ 'product.name': 1 });
    
    // Filter out items where product was deleted
    const filtered = inventory.filter(item => item.product !== null);
    
    console.log(`📊 Inventory query results:`);
    console.log(`   Total records: ${inventory.length}`);
    console.log(`   After filtering (product not null): ${filtered.length}`);
    console.log(`   Filtered out (deleted products): ${inventory.length - filtered.length}`);
    
    if (inventory.length - filtered.length > 0) {
      console.log(`\n⚠️  Found ${inventory.length - filtered.length} inventory records with deleted products!`);
      console.log(`   These records should be cleaned up.\n`);
      
      const orphaned = inventory.filter(item => item.product === null);
      console.log(`   Orphaned inventory IDs:`);
      orphaned.forEach((inv, i) => {
        console.log(`      ${i + 1}. ${inv._id}`);
      });
    }
    
    console.log(`\n✅ Endpoint will return: ${filtered.length} products`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testInventoryEndpoint();
