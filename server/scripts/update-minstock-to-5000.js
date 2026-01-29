require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function updateMinStock() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Avval statistika
    const totalProducts = await Product.countDocuments();
    console.log(`📦 Jami mahsulotlar: ${totalProducts}`);

    // O'zgartirishdan oldingi holat
    console.log('\n📊 O\'zgartirishdan OLDIN:');
    const beforeStats = await Product.aggregate([
      {
        $group: {
          _id: '$minStock',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    beforeStats.forEach(stat => {
      console.log(`  minStock = ${stat._id}: ${stat.count} ta mahsulot`);
    });

    // Tasdiqlash
    console.log('\n⚠️  DIQQAT: Barcha mahsulotlarning minStock qiymati 5000 ga o\'zgartiriladi!');
    console.log('⏳ 3 soniya kutilmoqda...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // FAQAT minStock maydonini yangilash
    console.log('🔄 minStock qiymatlarini yangilanmoqda...');
    const result = await Product.updateMany(
      {}, // Barcha mahsulotlar
      { 
        $set: { minStock: 5000 } // FAQAT minStock ni o'zgartirish
      }
    );

    console.log(`✅ Yangilandi: ${result.modifiedCount} ta mahsulot\n`);

    // O'zgartirishdan keyingi holat
    console.log('📊 O\'zgartirishdan KEYIN:');
    const afterStats = await Product.aggregate([
      {
        $group: {
          _id: '$minStock',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    afterStats.forEach(stat => {
      console.log(`  minStock = ${stat._id}: ${stat.count} ta mahsulot`);
    });

    // Namuna mahsulotlarni tekshirish
    console.log('\n📋 Namuna mahsulotlar (tasdiqlash uchun):');
    const sampleProducts = await Product.find()
      .select('code name minStock quantity price')
      .limit(5)
      .lean();
    
    sampleProducts.forEach(p => {
      console.log(`  - ${p.code} | ${p.name}`);
      console.log(`    minStock: ${p.minStock} | quantity: ${p.quantity} | price: ${p.price}`);
    });

    console.log('\n✅ Barcha mahsulotlarning minStock qiymati 5000 ga o\'zgartirildi!');
    console.log('✅ Boshqa ma\'lumotlarga hech qanday ta\'sir qilinmadi.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

updateMinStock();
