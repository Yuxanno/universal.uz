require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const WarehouseInventory = require('../src/models/WarehouseInventory');
const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');

async function checkInventoryQuantity() {
  try {
    console.log('🔍 MongoDB ga ulanilmoqda...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');

    // Barcha inventory yozuvlarini sanash
    const totalInventory = await WarehouseInventory.countDocuments();
    console.log(`📦 Jami inventory yozuvlar: ${totalInventory}`);

    // Omborlar soni
    const totalWarehouses = await Warehouse.countDocuments();
    console.log(`🏢 Jami omborlar: ${totalWarehouses}`);

    // quantity qiymatlari bo'yicha statistika
    const quantityStats = await WarehouseInventory.aggregate([
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

    console.log('\n📊 Inventory Miqdor (quantity) statistikasi:');
    if (quantityStats.length > 0) {
      const stats = quantityStats[0];
      console.log(`  Jami miqdor: ${stats.totalQuantity}`);
      console.log(`  O'rtacha: ${Math.round(stats.avgQuantity)}`);
      console.log(`  Minimal: ${stats.minQuantity}`);
      console.log(`  Maksimal: ${stats.maxQuantity}`);
    }

    // Miqdor bo'yicha guruhlar
    console.log('\n📊 Miqdor bo\'yicha guruhlar:');
    const rangeStats = await WarehouseInventory.aggregate([
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
      console.log(`  ${stat._id}: ${stat.count} ta yozuv`);
    });

    // Namuna inventory yozuvlar
    console.log('\n📋 Namuna inventory yozuvlar (birinchi 10 ta):');
    const sampleInventory = await WarehouseInventory.find()
      .populate('product', 'code name')
      .populate('warehouse', 'name')
      .limit(10)
      .lean();
    
    sampleInventory.forEach(inv => {
      console.log(`  - ${inv.product?.code} | ${inv.product?.name}`);
      console.log(`    Ombor: ${inv.warehouse?.name} | Miqdor: ${inv.quantity}`);
    });

    console.log('\n✅ Tekshirish tugadi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

checkInventoryQuantity();
