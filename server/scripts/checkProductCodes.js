const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Product = require('../src/models/Product');

async function checkProductCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Total products
    const totalProducts = await Product.countDocuments();
    console.log(`\n📊 Total products: ${totalProducts}`);

    // Max code
    const maxCodeProduct = await Product.findOne().sort({ code: -1 });
    console.log(`🔢 Max code: ${maxCodeProduct?.code || 'N/A'}`);

    // Find missing codes
    const allProducts = await Product.find({}, { code: 1 }).sort({ code: 1 });
    const codes = allProducts.map(p => parseInt(p.code)).filter(c => !isNaN(c));
    
    if (codes.length > 0) {
      const minCode = Math.min(...codes);
      const maxCode = Math.max(...codes);
      
      console.log(`\n📈 Code range: ${minCode} - ${maxCode}`);
      console.log(`📊 Expected products (if no gaps): ${maxCode - minCode + 1}`);
      console.log(`❌ Missing codes: ${(maxCode - minCode + 1) - codes.length}`);
      
      // Find gaps
      const missingCodes = [];
      for (let i = minCode; i <= maxCode; i++) {
        if (!codes.includes(i)) {
          missingCodes.push(i);
        }
      }
      
      if (missingCodes.length > 0) {
        console.log(`\n🔍 Missing code numbers (first 20):`);
        console.log(missingCodes.slice(0, 20).join(', '));
        if (missingCodes.length > 20) {
          console.log(`... and ${missingCodes.length - 20} more`);
        }
      }
    }

    // Check for duplicate codes
    const duplicates = await Product.aggregate([
      { $group: { _id: '$code', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicates.length > 0) {
      console.log(`\n⚠️  Duplicate codes found: ${duplicates.length}`);
      duplicates.forEach(d => {
        console.log(`  Code ${d._id}: ${d.count} products`);
      });
    } else {
      console.log(`\n✅ No duplicate codes`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProductCodes();
