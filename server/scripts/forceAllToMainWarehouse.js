const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function forceAllToMainWarehouse() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find or create "Asosiy ombor"
    let mainWarehouse = await Warehouse.findOne({ 
      $or: [
        { name: 'Asosiy ombor' },
        { isMain: true }
      ]
    });

    if (!mainWarehouse) {
      console.log('📦 Creating "Asosiy ombor"...');
      mainWarehouse = await Warehouse.create({
        name: 'Asosiy ombor',
        address: '',
        type: 'main',
        isMain: true
      });
      console.log('✅ "Asosiy ombor" created\n');
    } else {
      console.log(`✅ Found "Asosiy ombor": ${mainWarehouse._id}`);
      console.log(`   Name: ${mainWarehouse.name}`);
      console.log(`   Type: ${mainWarehouse.type}`);
      console.log(`   IsMain: ${mainWarehouse.isMain}\n`);
    }

    // Get all products
    const allProducts = await Product.find({}).lean();
    console.log(`📊 Total products in database: ${allProducts.length}\n`);

    // Step 1: Update all products to point to main warehouse
    console.log('🔄 STEP 1: Updating Product.warehouse field...');
    const productUpdateResult = await Product.updateMany(
      {},
      { 
        $set: { 
          warehouse: mainWarehouse._id,
          isMainWarehouse: true
        } 
      }
    );
    console.log(`   ✅ Updated ${productUpdateResult.modifiedCount} products\n`);

    // Step 2: Check WarehouseInventory
    console.log('🔄 STEP 2: Checking WarehouseInventory...');
    const allInventory = await WarehouseInventory.find({}).populate('warehouse product').lean();
    console.log(`   📦 Total inventory records: ${allInventory.length}`);

    // Group by warehouse
    const inventoryByWarehouse = {};
    for (const inv of allInventory) {
      const warehouseId = inv.warehouse?._id?.toString() || 'unknown';
      const warehouseName = inv.warehouse?.name || 'Unknown';
      
      if (!inventoryByWarehouse[warehouseId]) {
        inventoryByWarehouse[warehouseId] = {
          name: warehouseName,
          count: 0,
          items: []
        };
      }
      inventoryByWarehouse[warehouseId].count++;
      inventoryByWarehouse[warehouseId].items.push(inv);
    }

    console.log('\n   📊 Inventory distribution:');
    for (const [warehouseId, data] of Object.entries(inventoryByWarehouse)) {
      console.log(`      - ${data.name}: ${data.count} items`);
    }

    // Step 3: Consolidate inventory to main warehouse
    console.log('\n🔄 STEP 3: Consolidating inventory to main warehouse...');
    
    const mainWarehouseId = mainWarehouse._id.toString();
    let movedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    for (const [warehouseId, data] of Object.entries(inventoryByWarehouse)) {
      if (warehouseId === mainWarehouseId) {
        console.log(`   ⏭️  Skipping main warehouse (${data.count} items already there)`);
        continue;
      }

      console.log(`\n   🔄 Processing ${data.name} (${data.count} items)...`);
      
      for (const inv of data.items) {
        if (!inv.product) {
          console.log(`      ⚠️  Skipping inventory ${inv._id} - no product`);
          continue;
        }

        const productId = inv.product._id;
        
        // Check if this product already has inventory in main warehouse
        const existingMainInv = await WarehouseInventory.findOne({
          product: productId,
          warehouse: mainWarehouse._id
        });

        if (existingMainInv) {
          // Add quantity to existing inventory
          existingMainInv.quantity += inv.quantity;
          await existingMainInv.save();
          updatedCount++;
          console.log(`      ✅ Updated ${inv.product.name}: +${inv.quantity} (total: ${existingMainInv.quantity})`);
        } else {
          // Create new inventory in main warehouse
          await WarehouseInventory.create({
            product: productId,
            warehouse: mainWarehouse._id,
            quantity: inv.quantity,
            minStock: inv.minStock || 5
          });
          createdCount++;
          console.log(`      ✅ Created ${inv.product.name}: ${inv.quantity}`);
        }

        // Delete old inventory
        await WarehouseInventory.findByIdAndDelete(inv._id);
        movedCount++;
      }
    }

    console.log(`\n   📊 Inventory consolidation summary:`);
    console.log(`      - Items moved: ${movedCount}`);
    console.log(`      - New inventory created: ${createdCount}`);
    console.log(`      - Existing inventory updated: ${updatedCount}`);

    // Step 4: Verify
    console.log('\n🔍 STEP 4: Verification...');
    
    const finalProductCount = await Product.countDocuments({ warehouse: mainWarehouse._id });
    const finalInventoryCount = await WarehouseInventory.countDocuments({ warehouse: mainWarehouse._id });
    const otherWarehouseInventory = await WarehouseInventory.countDocuments({ 
      warehouse: { $ne: mainWarehouse._id } 
    });

    console.log(`   📊 Final state:`);
    console.log(`      - Products in "Asosiy ombor": ${finalProductCount}/${allProducts.length}`);
    console.log(`      - Inventory in "Asosiy ombor": ${finalInventoryCount}`);
    console.log(`      - Inventory in other warehouses: ${otherWarehouseInventory}`);

    if (finalProductCount === allProducts.length && otherWarehouseInventory === 0) {
      console.log('\n🎉 SUCCESS! All products and inventory are now in "Asosiy ombor"!');
    } else {
      console.log('\n⚠️  Warning: Some items may not have been moved.');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the migration
forceAllToMainWarehouse();
