/**
 * Create Missing Inventory Records
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function createMissingInventory() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_uz';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected\n');

    // Get all products
    const allProducts = await Product.find({});
    console.log(`📦 Total products: ${allProducts.length}`);

    // Get products with inventory
    const productsWithInventory = await WarehouseInventory.find({}).distinct('product');
    console.log(`📊 Products with inventory: ${productsWithInventory.length}`);

    // Find products without inventory
    const productsWithoutInventory = allProducts.filter(p => 
      !productsWithInventory.some(invProdId => invProdId.toString() === p._id.toString())
    );
    
    console.log(`⚠️  Products without inventory: ${productsWithoutInventory.length}\n`);

    if (productsWithoutInventory.length === 0) {
      console.log('✅ All products have inventory records!');
      return;
    }

    console.log('Creating inventory records...\n');

    let created = 0;
    let failed = 0;

    for (const product of productsWithoutInventory) {
      try {
        // Get product's warehouse or use default
        let warehouseId = product.warehouse;
        
        if (!warehouseId) {
          const defaultWarehouse = await Warehouse.findOne({ isMain: true });
          if (!defaultWarehouse) {
            console.log(`  ⚠️  No warehouse for product ${product.code}: ${product.name}`);
            failed++;
            continue;
          }
          warehouseId = defaultWarehouse._id;
        }

        // Check if inventory already exists
        const existingInventory = await WarehouseInventory.findOne({
          product: product._id,
          warehouse: warehouseId
        });

        if (existingInventory) {
          console.log(`  ⏭️  Inventory already exists for ${product.code}: ${product.name}`);
          continue;
        }

        // Create inventory record
        const inventory = new WarehouseInventory({
          product: product._id,
          warehouse: warehouseId,
          quantity: product.quantity || 0,
          minStock: product.minStock || 5
        });
        
        await inventory.save();
        created++;
        console.log(`  ✅ Created inventory for ${product.code}: ${product.name}`);
      } catch (err) {
        console.log(`  ❌ Failed for ${product.code}: ${err.message}`);
        failed++;
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Products without inventory: ${productsWithoutInventory.length}`);
    console.log(`Inventory records created: ${created}`);
    console.log(`Failed: ${failed}`);
    console.log('='.repeat(60));

    // Verify
    const finalInventoryCount = await WarehouseInventory.countDocuments();
    const finalProductsWithInventory = await WarehouseInventory.find({}).distinct('product');
    
    console.log('');
    console.log('📊 Final counts:');
    console.log(`  Total products: ${allProducts.length}`);
    console.log(`  Products with inventory: ${finalProductsWithInventory.length}`);
    console.log(`  Total inventory records: ${finalInventoryCount}`);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run
createMissingInventory();
