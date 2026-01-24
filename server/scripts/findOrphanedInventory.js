const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function findOrphanedInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const mainWarehouse = await Warehouse.findOne({ name: 'Asosiy ombor' });
    console.log(`\n🏢 Warehouse: ${mainWarehouse.name}\n`);
    
    // Get all inventory
    const allInventory = await WarehouseInventory.find({ 
      warehouse: mainWarehouse._id 
    }).populate('product').lean();
    
    console.log(`📋 Total inventory: ${allInventory.length}\n`);
    
    // Find orphaned (product is null or deleted)
    const orphaned = allInventory.filter(inv => !inv.product);
    
    if (orphaned.length > 0) {
      console.log(`⚠️  Orphaned inventory (${orphaned.length}):\n`);
      orphaned.forEach(inv => {
        console.log(`   ID: ${inv._id}`);
        console.log(`   Product ID: ${inv.product}`);
        console.log(`   Quantity: ${inv.quantity}`);
        console.log('');
      });
    } else {
      console.log('✅ No orphaned inventory');
    }
    
    // Find duplicates (same product, same warehouse)
    const productCounts = {};
    allInventory.forEach(inv => {
      if (inv.product) {
        const key = inv.product._id.toString();
        productCounts[key] = (productCounts[key] || 0) + 1;
      }
    });
    
    const duplicates = Object.entries(productCounts).filter(([_, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Duplicate inventory (${duplicates.length} products):\n`);
      for (const [productId, count] of duplicates) {
        const invs = allInventory.filter(inv => inv.product && inv.product._id.toString() === productId);
        console.log(`   Product: ${invs[0].product.code} - ${invs[0].product.name}`);
        console.log(`   Count: ${count} inventory records`);
        invs.forEach((inv, i) => {
          console.log(`      ${i + 1}. ID: ${inv._id}, Qty: ${inv.quantity}`);
        });
        console.log('');
      }
    } else {
      console.log('\n✅ No duplicate inventory');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findOrphanedInventory();
