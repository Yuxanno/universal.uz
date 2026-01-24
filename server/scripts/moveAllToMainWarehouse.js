const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');

async function moveAllToMainWarehouse() {
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
      console.log(`✅ Found "Asosiy ombor": ${mainWarehouse._id}\n`);
    }

    // Get all products
    const allProducts = await Product.find({});
    console.log(`📊 Total products found: ${allProducts.length}`);

    // Count products not in main warehouse
    const productsNotInMain = allProducts.filter(p => 
      !p.warehouse || p.warehouse.toString() !== mainWarehouse._id.toString()
    );
    console.log(`🔄 Products to move: ${productsNotInMain.length}\n`);

    if (productsNotInMain.length === 0) {
      console.log('✅ All products are already in "Asosiy ombor"!');
      console.log('   But we will still update all products to ensure consistency...\n');
    } else {
      console.log('⚠️  Moving ALL products to "Asosiy ombor"!');
      console.log(`   - Total products: ${allProducts.length}`);
      console.log(`   - Products to move: ${productsNotInMain.length}`);
      console.log(`   - Target warehouse: ${mainWarehouse.name} (${mainWarehouse._id})\n`);
    }

    // Update all products
    console.log('🔄 Moving products...');
    const result = await Product.updateMany(
      { 
        $or: [
          { warehouse: { $ne: mainWarehouse._id } },
          { warehouse: { $exists: false } },
          { warehouse: null }
        ]
      },
      { 
        $set: { 
          warehouse: mainWarehouse._id,
          isMainWarehouse: true
        } 
      }
    );

    console.log(`\n✅ Migration completed!`);
    console.log(`   - Matched: ${result.matchedCount} products`);
    console.log(`   - Modified: ${result.modifiedCount} products`);

    // Verify
    const verifyCount = await Product.countDocuments({ warehouse: mainWarehouse._id });
    console.log(`\n📊 Verification:`);
    console.log(`   - Products in "Asosiy ombor": ${verifyCount}`);
    console.log(`   - Total products: ${allProducts.length}`);

    if (verifyCount === allProducts.length) {
      console.log('\n🎉 SUCCESS! All products are now in "Asosiy ombor"!');
    } else {
      console.log('\n⚠️  Warning: Some products may not have been moved.');
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
moveAllToMainWarehouse();
