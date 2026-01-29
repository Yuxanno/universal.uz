require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function checkQuantity() {
  try {
    console.log('🔍 MongoDB ga ulanilmoqda...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');

    // Barcha mahsulotlarni sanash
    const totalProducts = await Product.countDocuments();
    console.log(`📦 Jami mahsulotlar: ${totalProducts}`);

    // quantity qiymatlari bo'yicha statistika
    const quantityStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          avgQuantity: { $avg: '$quantity' },
          minQuantity: { $min: '$quantity' },
          maxQuantity: { $max: '$quantity' }
        }
      }
    ]);

    console.log('\n📊 Miqdor (quantity) statistikasi:');
    if (quantityStats.length > 0) {
      const stats = quantityStats[0];
      console.log(`  Jami miqdor: ${stats.totalQuantity}`);
      console.log(`  O'rtacha: ${Math.round(stats.avgQuantity)}`);
      console.log(`  Minimal: ${stats.minQuantity}`);
      console.log(`  Maksimal: ${stats.maxQuantity}`);
    }

    // Miqdor bo'yicha guruhlar
    console.log('\n📊 Miqdor bo\'yicha guruhlar:');
    const rangeStats = await Product.aggregate([
      {
        $bucket: {
          groupBy: '$quantity',
          boundaries: [0, 10, 50, 100, 500, 1000, 5000, 10000],
          default: '10000+',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);
    
    rangeStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} ta mahsulot`);
    });

    // Namuna mahsulotlar
    console.log('\n📋 Namuna mahsulotlar (birinchi 10 ta):');
    const sampleProducts = await Product.find()
      .select('code name quantity price')
      .limit(10)
      .lean();
    
    sampleProducts.forEach(p => {
      console.log(`  - ${p.code} | ${p.name}`);
      console.log(`    Miqdor: ${p.quantity} | Narx: ${p.price}`);
    });

    console.log('\n✅ Tekshirish tugadi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

checkQuantity();
