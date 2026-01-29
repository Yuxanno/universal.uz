require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function updateQuantity() {
  try {
    console.log('🔍 MongoDB ga ulanilmoqda...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');

    // Avval statistika
    const totalProducts = await Product.countDocuments();
    console.log(`📦 Jami mahsulotlar: ${totalProducts}`);

    // O'zgartirishdan oldingi holat
    console.log('\n📊 O\'zgartirishdan OLDIN:');
    const beforeStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          avgQuantity: { $avg: '$quantity' }
        }
      }
    ]);
    
    if (beforeStats.length > 0) {
      console.log(`  Jami miqdor: ${beforeStats[0].totalQuantity}`);
      console.log(`  O'rtacha: ${Math.round(beforeStats[0].avgQuantity)}`);
    }

    // Tasdiqlash
    console.log('\n⚠️  DIQQAT: Barcha mahsulotlarning quantity (miqdor) qiymati 5000 ga o\'zgartiriladi!');
    console.log('⏳ 3 soniya kutilmoqda...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // FAQAT quantity maydonini yangilash
    console.log('🔄 Quantity qiymatlarini yangilanmoqda...');
    const result = await Product.updateMany(
      {}, // Barcha mahsulotlar
      { 
        $set: { quantity: 5000 } // FAQAT quantity ni o'zgartirish
      }
    );

    console.log(`✅ Yangilandi: ${result.modifiedCount} ta mahsulot\n`);

    // O'zgartirishdan keyingi holat
    console.log('📊 O\'zgartirishdan KEYIN:');
    const afterStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          avgQuantity: { $avg: '$quantity' }
        }
      }
    ]);
    
    if (afterStats.length > 0) {
      console.log(`  Jami miqdor: ${afterStats[0].totalQuantity}`);
      console.log(`  O'rtacha: ${Math.round(afterStats[0].avgQuantity)}`);
    }

    // Namuna mahsulotlarni tekshirish
    console.log('\n📋 Namuna mahsulotlar (tasdiqlash uchun):');
    const sampleProducts = await Product.find()
      .select('code name quantity price')
      .limit(5)
      .lean();
    
    sampleProducts.forEach(p => {
      console.log(`  - ${p.code} | ${p.name}`);
      console.log(`    Miqdor: ${p.quantity} | Narx: ${p.price}`);
    });

    console.log('\n✅ Barcha mahsulotlarning miqdori (quantity) 5000 ga o\'zgartirildi!');
    console.log('✅ Boshqa ma\'lumotlarga hech qanday ta\'sir qilinmadi.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

updateQuantity();
