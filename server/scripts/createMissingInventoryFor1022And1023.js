const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function createMissingInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const mainWarehouse = await Warehouse.findOne({ name: 'Asosiy ombor' });
    console.log(`\n🏢 Warehouse: ${mainWarehouse.name}\n`);
    
    // Find products 1022 and 1023
    const products = await Product.find({ 
      code: { $in: ['1022', '1023'] },
      warehouse: mainWarehouse._id 
    });
    
    console.log(`📦 Found ${products.length} products\n`);
    
    for (const product of products) {
      console.log(`Processing: ${product.code} - ${product.name}`);
      
      // Check if inventory exists
      const existingInv = await WarehouseInventory.findOne({
        product: product._id,
        warehouse: mainWarehouse._id
      });
      
      if (existingInv) {
        console.log(`   ⏭️  Inventory already exists (qty: ${existingInv.quantity})`);
      } else {
        // Create inventory
        await WarehouseInventory.create({
          product: product._id,
          warehouse: mainWarehouse._id,
          quantity: product.quantity || 0,
          minStock: product.minStock || 5
        });
        console.log(`   ✅ Created inventory (qty: ${product.quantity})`);
      }
    }
    
    // Verify
    console.log('\n🔍 Verification:\n');
    const totalInventory = await WarehouseInventory.countDocuments({ 
      warehouse: mainWarehouse._id 
    });
    const totalProducts = await Product.countDocuments({ 
      warehouse: mainWarehouse._id 
    });
    
    console.log(`   Products: ${totalProducts}`);
    console.log(`   Inventory: ${totalInventory}`);
    console.log(`   ${totalProducts === totalInventory ? '✅' : '❌'} Match: ${totalProducts === totalInventory ? 'YES' : 'NO'}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createMissingInventory();
