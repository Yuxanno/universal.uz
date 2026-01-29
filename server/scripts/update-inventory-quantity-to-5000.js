require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function updateInventoryQuantity() {
  try {
    console.log('🔍 MongoDB ga ulanilmoqda...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');

    // Avval statistika
    const totalInventory = await WarehouseInventory.countDocuments();
    console.log(`📦 Jami inventory yozuvlar: ${totalInventory}`);

    // O'zgartirishdan oldingi holat
    console.log('\n📊 O\'zgartirishdan OLDIN:');
    const beforeStats = await WarehouseInventory.aggregate([
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
    console.log('\n⚠️  DIQQAT: Barcha inventory yozuvlarning quantity (miqdor) qiymati 5000 ga o\'zgartiriladi!');
    console.log('⏳ 3 soniya kutilmoqda...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // FAQAT quantity maydonini yangilash
    console.log('🔄 Inventory quantity qiymatlarini yangilanmoqda...');
    const result = await WarehouseInventory.updateMany(
      {}, // Barcha inventory yozuvlar
      { 
        $set: { 
          quantity: 5000,
          lastUpdated: new Date()
        }
      }
    );

    console.log(`✅ Yangilandi: ${result.modifiedCount} ta inventory yozuv\n`);

    // O'zgartirishdan keyingi holat
    console.log('📊 O\'zgartirishdan KEYIN:');
    const afterStats = await WarehouseInventory.aggregate([
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

    // Namuna inventory yozuvlarni tekshirish
    console.log('\n📋 Namuna inventory yozuvlar (tasdiqlash uchun):');
    const sampleInventory = await WarehouseInventory.find()
      .populate('product', 'code name')
      .populate('warehouse', 'name')
      .limit(5)
      .lean();
    
    sampleInventory.forEach(inv => {
      console.log(`  - ${inv.product?.code} | ${inv.product?.name}`);
      console.log(`    Ombor: ${inv.warehouse?.name} | Miqdor: ${inv.quantity}`);
    });

    console.log('\n✅ Barcha inventory yozuvlarning miqdori (quantity) 5000 ga o\'zgartirildi!');
    console.log('✅ Boshqa ma\'lumotlarga hech qanday ta\'sir qilinmadi.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

updateInventoryQuantity();
