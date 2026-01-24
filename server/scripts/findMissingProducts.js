/**
 * Find Missing Products
 * 
 * This script helps identify which 14 products are missing
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Product = require('../src/models/Product');

async function findMissing() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_uz');
    console.log('✅ MongoDB connected\n');

    // Get all products
    const products = await Product.find({}).sort({ code: 1 });
    console.log(`📦 Current products: ${products.length}\n`);

    // Check for gaps in codes
    console.log('🔍 Checking for gaps in product codes...\n');
    
    const codes = products.map(p => parseInt(p.code)).filter(c => !isNaN(c)).sort((a, b) => a - b);
    
    const gaps = [];
    for (let i = 0; i < codes.length - 1; i++) {
      const current = codes[i];
      const next = codes[i + 1];
      
      if (next - current > 1) {
        for (let missing = current + 1; missing < next; missing++) {
          gaps.push(missing);
        }
      }
    }

    if (gaps.length > 0) {
      console.log(`⚠️  Found ${gaps.length} gaps in product codes:`);
      gaps.slice(0, 20).forEach(code => {
        console.log(`  Missing code: ${String(code).padStart(3, '0')}`);
      });
      
      if (gaps.length > 20) {
        console.log(`  ... and ${gaps.length - 20} more`);
      }
    } else {
      console.log('✅ No gaps found in product codes');
    }

    // Check for duplicates
    console.log('\n🔍 Checking for duplicate codes...\n');
    
    const duplicates = await Product.aggregate([
      {
        $group: {
          _id: '$code',
          count: { $sum: 1 },
          products: { $push: { id: '$_id', name: '$name' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate codes:`);
      duplicates.forEach(dup => {
        console.log(`\n  Code: ${dup._id} (${dup.count} times)`);
        dup.products.forEach(p => {
          console.log(`    - ${p.name} (${p.id})`);
        });
      });
    } else {
      console.log('✅ No duplicate codes found');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY');
    console.log('='.repeat(50));
    console.log(`Current products: ${products.length}`);
    console.log(`Expected products: 979`);
    console.log(`Missing: ${979 - products.length}`);
    console.log(`Gaps in codes: ${gaps.length}`);
    console.log(`Duplicate codes: ${duplicates.length}`);
    console.log('='.repeat(50));

    console.log('\n💡 Recommendations:');
    if (gaps.length > 0) {
      console.log('  1. Some products were deleted (gaps in codes)');
      console.log('  2. You need to restore from backup');
    }
    if (duplicates.length > 0) {
      console.log('  3. Remove duplicate products');
    }
    if (products.length < 979) {
      console.log('  4. Restore from backup to get all 979 products');
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

findMissing();
