/**
 * Check Product Count and Find Missing Products
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function checkProducts() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_uz';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected\n');

    // Get all products
    const allProducts = await Product.find({});
    console.log(`📦 Total products in database: ${allProducts.length}`);

    // Get products with inventory
    const productsWithInventory = await WarehouseInventory.find({})
      .distinct('product');
    console.log(`📊 Products with inventory: ${productsWithInventory.length}`);

    // Find products without inventory
    const productsWithoutInventory = allProducts.filter(p => 
      !productsWithInventory.some(invProdId => invProdId.toString() === p._id.toString())
    );
    
    console.log(`\n⚠️  Products WITHOUT inventory: ${productsWithoutInventory.length}`);
    
    if (productsWithoutInventory.length > 0) {
      console.log('\nList of products without inventory:');
      productsWithoutInventory.slice(0, 10).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} (Code: ${p.code}, Qty: ${p.quantity})`);
      });
      
      if (productsWithoutInventory.length > 10) {
        console.log(`  ... and ${productsWithoutInventory.length - 10} more`);
      }
    }

    // Check for duplicates
    const duplicates = await Product.aggregate([
      {
        $group: {
          _id: '$code',
          count: { $sum: 1 },
          products: { $push: { id: '$_id', name: '$name', code: '$code' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`\n🔄 Duplicate codes found: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('\nDuplicate products:');
      duplicates.slice(0, 5).forEach((dup, i) => {
        console.log(`  ${i + 1}. Code: ${dup._id} (${dup.count} times)`);
        dup.products.forEach(p => {
          console.log(`     - ${p.name} (ID: ${p.id})`);
        });
      });
    }

    // Check inventory count
    const inventoryCount = await WarehouseInventory.countDocuments();
    console.log(`\n📋 Total inventory records: ${inventoryCount}`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Products: ${allProducts.length}`);
    console.log(`Products with Inventory: ${productsWithInventory.length}`);
    console.log(`Products without Inventory: ${productsWithoutInventory.length}`);
    console.log(`Duplicate Codes: ${duplicates.length}`);
    console.log(`Total Inventory Records: ${inventoryCount}`);
    console.log('='.repeat(50));

    // Difference explanation
    const difference = 979 - allProducts.length;
    if (difference > 0) {
      console.log(`\n❓ Missing ${difference} products from original 979`);
      console.log('\nPossible reasons:');
      console.log('  1. Duplicate products were removed');
      console.log('  2. Invalid products were cleaned up');
      console.log('  3. Products with empty names/codes were removed');
      console.log('  4. Database was cleaned before migration');
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run check
checkProducts();
