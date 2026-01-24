const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function createMissingInventoryForAll() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find "Asosiy ombor"
    const mainWarehouse = await Warehouse.findOne({ 
      $or: [
        { name: 'Asosiy ombor' },
        { isMain: true }
      ]
    });

    if (!mainWarehouse) {
      console.error('❌ "Asosiy ombor" not found!');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Found "Asosiy ombor": ${mainWarehouse._id}\n`);

    // Get all products
    const allProducts = await Product.find({}).lean();
    console.log(`📊 Total products: ${allProducts.length}`);

    // Get all inventory for main warehouse
    const existingInventory = await WarehouseInventory.find({ 
      warehouse: mainWarehouse._id 
    }).lean();
    console.log(`📦 Existing inventory records: ${existingInventory.length}\n`);

    // Create a Set of product IDs that already have inventory
    const productsWithInventory = new Set(
      existingInventory.map(inv => inv.product.toString())
    );

    // Find products without inventory
    const productsWithoutInventory = allProducts.filter(
      product => !productsWithInventory.has(product._id.toString())
    );

    console.log(`🔍 Products without inventory: ${productsWithoutInventory.length}\n`);

    if (productsWithoutInventory.length === 0) {
      console.log('✅ All products already have inventory!');
      await mongoose.connection.close();
      return;
    }

    console.log('📋 Products missing inventory:');
    productsWithoutInventory.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.code} - ${p.name} (qty: ${p.quantity})`);
    });

    console.log('\n🔄 Creating missing inventory records...\n');

    let createdCount = 0;
    for (const product of productsWithoutInventory) {
      try {
        await WarehouseInventory.create({
          product: product._id,
          warehouse: mainWarehouse._id,
          quantity: product.quantity || 0,
          minStock: product.minStock || 5
        });
        createdCount++;
        console.log(`   ✅ Created inventory for: ${product.code} - ${product.name} (qty: ${product.quantity})`);
      } catch (err) {
        console.error(`   ❌ Failed to create inventory for ${product.code}: ${err.message}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Products without inventory: ${productsWithoutInventory.length}`);
    console.log(`   - Inventory records created: ${createdCount}`);

    // Verify
    const finalInventoryCount = await WarehouseInventory.countDocuments({ 
      warehouse: mainWarehouse._id 
    });
    console.log(`\n🔍 Verification:`);
    console.log(`   - Total products: ${allProducts.length}`);
    console.log(`   - Total inventory records: ${finalInventoryCount}`);

    if (finalInventoryCount === allProducts.length) {
      console.log('\n🎉 SUCCESS! All products now have inventory records!');
    } else {
      console.log(`\n⚠️  Warning: Still missing ${allProducts.length - finalInventoryCount} inventory records`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createMissingInventoryForAll();
