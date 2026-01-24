const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function checkMissingProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const mainWarehouse = await Warehouse.findOne({ name: 'Asosiy ombor' });
    console.log(`\n🏢 Checking: ${mainWarehouse.name} (${mainWarehouse._id})\n`);
    
    // Get all products
    const allProducts = await Product.find({ warehouse: mainWarehouse._id })
      .sort({ code: 1 })
      .lean();
    console.log(`📦 Total products in warehouse: ${allProducts.length}`);
    
    // Get all inventory
    const allInventory = await WarehouseInventory.find({ warehouse: mainWarehouse._id })
      .populate('product')
      .lean();
    console.log(`📋 Total inventory records: ${allInventory.length}\n`);
    
    // Find products without inventory
    const inventoryProductIds = new Set(
      allInventory
        .filter(inv => inv.product)
        .map(inv => inv.product._id.toString())
    );
    
    const productsWithoutInventory = allProducts.filter(
      p => !inventoryProductIds.has(p._id.toString())
    );
    
    if (productsWithoutInventory.length > 0) {
      console.log(`⚠️  Products WITHOUT inventory (${productsWithoutInventory.length}):\n`);
      productsWithoutInventory.forEach(p => {
        console.log(`   ${p.code} - ${p.name} (qty: ${p.quantity})`);
      });
    } else {
      console.log('✅ All products have inventory records');
    }
    
    // Check for specific codes
    console.log('\n🔍 Checking specific codes (1021, 1022, 1023):\n');
    
    for (const code of ['1021', '1022', '1023']) {
      const product = await Product.findOne({ code, warehouse: mainWarehouse._id });
      const inventory = product ? await WarehouseInventory.findOne({ 
        product: product._id, 
        warehouse: mainWarehouse._id 
      }).populate('product') : null;
      
      console.log(`Code ${code}:`);
      if (product) {
        console.log(`   ✅ Product exists: ${product.name}`);
        console.log(`      ID: ${product._id}`);
        console.log(`      Quantity: ${product.quantity}`);
        console.log(`      Warehouse: ${product.warehouse}`);
        if (inventory) {
          console.log(`   ✅ Inventory exists: qty ${inventory.quantity}`);
        } else {
          console.log(`   ❌ Inventory MISSING!`);
        }
      } else {
        console.log(`   ❌ Product NOT FOUND`);
      }
      console.log('');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMissingProducts();
