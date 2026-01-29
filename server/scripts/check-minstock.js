require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function checkMinStock() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Barcha mahsulotlarni sanash
    const totalProducts = await Product.countDocuments();
    console.log(`📦 Jami mahsulotlar: ${totalProducts}`);

    // minStock qiymatlari bo'yicha statistika
    const minStockStats = await Product.aggregate([
      {
        $group: {
          _id: '$minStock',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 minStock qiymatlari statistikasi:');
    minStockStats.forEach(stat => {
      console.log(`  minStock = ${stat._id}: ${stat.count} ta mahsulot`);
    });

    // Namuna mahsulotlar
    console.log('\n📋 Namuna mahsulotlar (birinchi 5 ta):');
    const sampleProducts = await Product.find()
      .select('code name minStock')
      .limit(5)
      .lean();
    
    sampleProducts.forEach(p => {
      console.log(`  - ${p.code} | ${p.name} | minStock: ${p.minStock || 'undefined'}`);
    });

    console.log('\n✅ Tekshirish tugadi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

checkMinStock();
