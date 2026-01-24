/**
 * Analyze Products - Find Issues
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function analyzeProducts() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_uz';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected\n');

    // Get all products
    const allProducts = await Product.find({}).sort({ code: 1 });
    console.log(`📦 Total products: ${allProducts.length}\n`);

    // Check for missing codes
    const codes = allProducts.map(p => parseInt(p.code)).filter(c => !isNaN(c)).sort((a, b) => a - b);
    const minCode = codes[0];
    const maxCode = codes[codes.length - 1];
    
    console.log(`📊 Code range: ${minCode} - ${maxCode}`);
    console.log(`📊 Expected products in range: ${maxCode - minCode + 1}`);
    console.log(`📊 Actual products: ${codes.length}`);
    console.log(`📊 Missing: ${(maxCode - minCode + 1) - codes.length}\n`);

    // Find gaps in codes
    const gaps = [];
    for (let i = minCode; i <= maxCode; i++) {
      if (!codes.includes(i)) {
        gaps.push(i);
      }
    }

    if (gaps.length > 0) {
      console.log(`⚠️  Found ${gaps.length} gaps in product codes:\n`);
      
      // Show first 20 gaps
      const showGaps = gaps.slice(0, 20);
      showGaps.forEach(code => {
        console.log(`  Missing code: ${code}`);
      });
      
      if (gaps.length > 20) {
        console.log(`  ... and ${gaps.length - 20} more gaps`);
      }
      console.log('');
    }

    // Check for products with invalid data
    console.log('🔍 Checking for invalid products...\n');
    
    const invalidProducts = allProducts.filter(p => 
      !p.name || p.name.trim() === '' || 
      !p.code || p.code.trim() === '' ||
      p.price === undefined || p.price === null
    );
    
    if (invalidProducts.length > 0) {
      console.log(`⚠️  Found ${invalidProducts.length} invalid products:`);
      invalidProducts.forEach(p => {
        console.log(`  - ID: ${p._id}, Code: ${p.code}, Name: "${p.name}", Price: ${p.price}`);
      });
      console.log('');
    } else {
      console.log('✅ All products have valid data\n');
    }

    // Check products without inventory
    const productsWithInventory = await WarehouseInventory.find({}).distinct('product');
    const productsWithoutInventory = allProducts.filter(p => 
      !productsWithInventory.some(invProdId => invProdId.toString() === p._id.toString())
    );
    
    console.log(`📊 Products without inventory: ${productsWithoutInventory.length}`);
    
    if (productsWithoutInventory.length > 0) {
      console.log('\nFirst 10 products without inventory:');
      productsWithoutInventory.slice(0, 10).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} (Code: ${p.code}, Qty: ${p.quantity})`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total Products: ${allProducts.length}`);
    console.log(`Code Range: ${minCode} - ${maxCode}`);
    console.log(`Missing Codes (gaps): ${gaps.length}`);
    console.log(`Invalid Products: ${invalidProducts.length}`);
    console.log(`Products without Inventory: ${productsWithoutInventory.length}`);
    console.log('='.repeat(60));

    // Recommendation
    console.log('\n💡 RECOMMENDATION:');
    if (gaps.length > 0) {
      console.log(`  - You have ${gaps.length} missing product codes`);
      console.log('  - These products were likely deleted');
      console.log('  - To restore them, you need a backup');
    }
    if (productsWithoutInventory.length > 0) {
      console.log(`  - ${productsWithoutInventory.length} products don't have inventory records`);
      console.log('  - Run migration script to create inventory for them');
    }
    if (gaps.length === 0 && invalidProducts.length === 0) {
      console.log('  - Your database looks healthy!');
      console.log(`  - You have ${allProducts.length} products`);
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run analysis
analyzeProducts();
