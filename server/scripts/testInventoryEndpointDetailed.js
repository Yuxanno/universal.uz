const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function testInventoryEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const mainWarehouse = await Warehouse.findOne({ name: 'Asosiy ombor' });
    console.log(`\n🏢 Testing: ${mainWarehouse.name} (${mainWarehouse._id})\n`);
    
    // Simulate endpoint query
    const inventory = await WarehouseInventory.find({ warehouse: mainWarehouse._id })
      .populate('product')
      .populate('warehouse');
    
    console.log(`📋 Total inventory: ${inventory.length}`);
    
    // Filter out null products
    const filtered = inventory.filter(item => item.product !== null);
    console.log(`📋 After filtering nulls: ${filtered.length}`);
    
    // Sort by code
    filtered.sort((a, b) => {
      const codeA = parseInt(a.product.code) || 0;
      const codeB = parseInt(b.product.code) || 0;
      return codeA - codeB;
    });
    
    console.log(`\n📊 Last 5 products:\n`);
    filtered.slice(-5).forEach(inv => {
      console.log(`   ${inv.product.code} - ${inv.product.name} (qty: ${inv.quantity})`);
    });
    
    // Check specific codes
    console.log(`\n🔍 Checking 1021, 1022, 1023:\n`);
    ['1021', '1022', '1023'].forEach(code => {
      const found = filtered.find(inv => inv.product.code === code);
      if (found) {
        console.log(`   ✅ ${code}: ${found.product.name} (qty: ${found.quantity})`);
      } else {
        console.log(`   ❌ ${code}: NOT FOUND`);
      }
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testInventoryEndpoint();
