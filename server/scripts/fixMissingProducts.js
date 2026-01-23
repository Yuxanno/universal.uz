/**
 * Fix Missing Products - Create placeholder products for missing codes
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function fixMissingProducts() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_uz';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected\n');

    // Get all products
    const allProducts = await Product.find({}).sort({ code: 1 });
    console.log(`📦 Current products: ${allProducts.length}\n`);

    // Find missing codes
    const codes = allProducts.map(p => parseInt(p.code)).filter(c => !isNaN(c)).sort((a, b) => a - b);
    const minCode = codes[0];
    const maxCode = codes[codes.length - 1];
    
    const missingCodes = [];
    for (let i = minCode; i <= maxCode; i++) {
      if (!codes.includes(i)) {
        missingCodes.push(i);
      }
    }

    console.log(`⚠️  Found ${missingCodes.length} missing codes:`);
    console.log(missingCodes.join(', '));
    console.log('');

    if (missingCodes.length === 0) {
      console.log('✅ No missing codes found!');
      return;
    }

    // Get default warehouse
    const defaultWarehouse = await Warehouse.findOne({ isMain: true });
    if (!defaultWarehouse) {
      console.log('❌ No default warehouse found!');
      console.log('Please create a main warehouse first.');
      return;
    }

    console.log(`📦 Using warehouse: ${defaultWarehouse.name}\n`);

    // Ask for confirmation
    console.log('⚠️  WARNING: This will create placeholder products for missing codes.');
    console.log('These products will have:');
    console.log('  - Name: "O\'chirilgan tovar [CODE]"');
    console.log('  - Price: 0');
    console.log('  - Quantity: 0');
    console.log('');
    console.log('You should update these products with correct information later.');
    console.log('');
    console.log('To proceed, run this script with --confirm flag:');
    console.log('  node server/scripts/fixMissingProducts.js --confirm');
    console.log('');

    // Check for --confirm flag
    const confirmed = process.argv.includes('--confirm');
    
    if (!confirmed) {
      console.log('❌ Not confirmed. Exiting...');
      return;
    }

    console.log('✅ Confirmed. Creating placeholder products...\n');

    // Create placeholder products
    let created = 0;
    for (const code of missingCodes) {
      try {
        const product = new Product({
          code: code.toString(),
          name: `O'chirilgan tovar ${code}`,
          price: 0,
          costPrice: 0,
          quantity: 0,
          warehouse: defaultWarehouse._id,
          category: 'O\'chirilgan'
        });
        
        await product.save();
        
        // Create inventory record
        const inventory = new WarehouseInventory({
          product: product._id,
          warehouse: defaultWarehouse._id,
          quantity: 0,
          minStock: 0
        });
        
        await inventory.save();
        
        created++;
        console.log(`  ✅ Created product ${code}: ${product.name}`);
      } catch (err) {
        console.log(`  ❌ Failed to create product ${code}: ${err.message}`);
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log(`✅ Created ${created} placeholder products`);
    console.log('='.repeat(60));
    console.log('');
    console.log('📝 Next steps:');
    console.log('  1. Go to your admin panel');
    console.log('  2. Find products with category "O\'chirilgan"');
    console.log('  3. Update them with correct information');
    console.log('  4. Or delete them if they are not needed');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run fix
fixMissingProducts();
