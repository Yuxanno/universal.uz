// VPS da bugungi savdolarni tekshirish scripti
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  receiptNumber: String,
  items: Array,
  total: Number,
  cashAmount: Number,
  cardAmount: Number,
  debtAmount: Number,
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'completed' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Receipt = mongoose.model('Receipt', receiptSchema);

async function checkTodaySales() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB ga ulandi');
    
    const now = new Date();
    console.log('\n📅 Hozirgi vaqt (server):', now.toISOString());
    console.log('📅 Hozirgi vaqt (local):', now.toString());
    
    // UTC vaqtida bugun
    const todayUTC = new Date();
    todayUTC.setHours(0, 0, 0, 0);
    console.log('\n🕐 Bugun UTC (00:00):', todayUTC.toISOString());
    
    // O'zbekiston vaqtida bugun (UTC+5)
    const uzbekistanOffset = 5 * 60 * 60 * 1000;
    const uzbekistanNow = new Date(now.getTime() + uzbekistanOffset);
    const todayUzbekistan = new Date(uzbekistanNow);
    todayUzbekistan.setUTCHours(0, 0, 0, 0);
    const todayUzbekistanUTC = new Date(todayUzbekistan.getTime() - uzbekistanOffset);
    console.log('🕐 Bugun O\'zbekiston (00:00 UTC+5):', todayUzbekistanUTC.toISOString());
    
    // UTC bilan hisoblash
    const salesUTC = await Receipt.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: todayUTC } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);
    
    // O'zbekiston vaqti bilan hisoblash
    const salesUzbekistan = await Receipt.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: todayUzbekistanUTC } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);
    
    console.log('\n💰 Bugungi savdo (UTC 00:00 dan):');
    console.log('   Summa:', salesUTC[0]?.total || 0, 'so\'m');
    console.log('   Cheklar:', salesUTC[0]?.count || 0, 'ta');
    
    console.log('\n💰 Bugungi savdo (O\'zbekiston 00:00 dan):');
    console.log('   Summa:', salesUzbekistan[0]?.total || 0, 'so\'m');
    console.log('   Cheklar:', salesUzbekistan[0]?.count || 0, 'ta');
    
    // Oxirgi 10 ta chekni ko'rsatish
    console.log('\n📋 Oxirgi 10 ta chek:');
    const recentReceipts = await Receipt.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('receiptNumber total createdAt');
    
    recentReceipts.forEach(r => {
      const date = new Date(r.createdAt);
      const uzbekTime = new Date(date.getTime() + uzbekistanOffset);
      console.log(`   #${r.receiptNumber} - ${r.total} so'm - ${date.toISOString()} (Uzbek: ${uzbekTime.toLocaleString('uz-UZ')})`);
    });
    
    // Bugungi cheklar (O'zbekiston vaqti bo'yicha)
    console.log('\n📋 Bugungi cheklar (O\'zbekiston vaqti):');
    const todayReceipts = await Receipt.find({ 
      status: 'completed', 
      createdAt: { $gte: todayUzbekistanUTC } 
    })
      .sort({ createdAt: -1 })
      .select('receiptNumber total createdAt');
    
    if (todayReceipts.length === 0) {
      console.log('   ❌ Bugun hech qanday chek yo\'q');
    } else {
      todayReceipts.forEach(r => {
        const date = new Date(r.createdAt);
        const uzbekTime = new Date(date.getTime() + uzbekistanOffset);
        console.log(`   #${r.receiptNumber} - ${r.total} so'm - ${uzbekTime.toLocaleString('uz-UZ')}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Tekshirish tugadi');
  } catch (error) {
    console.error('❌ Xato:', error.message);
    process.exit(1);
  }
}

checkTodaySales();
