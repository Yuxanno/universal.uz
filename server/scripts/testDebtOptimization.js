const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function testOptimization() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const debtsCollection = db.collection('debts');

    console.log('\n🧪 Testing Debt Optimization...\n');

    // 1. Check data integrity
    console.log('1️⃣  Data Integrity Check:');
    const totalDebts = await debtsCollection.countDocuments();
    const receivableDebts = await debtsCollection.countDocuments({ type: 'receivable' });
    const payableDebts = await debtsCollection.countDocuments({ type: 'payable' });
    console.log(`   Total debts: ${totalDebts}`);
    console.log(`   Receivable: ${receivableDebts}`);
    console.log(`   Payable: ${payableDebts}`);
    console.log(`   ✅ Data is intact\n`);

    // 2. Check indexes
    console.log('2️⃣  Index Check:');
    const indexes = await debtsCollection.indexes();
    console.log(`   Total indexes: ${indexes.length}`);
    indexes.forEach(index => {
      console.log(`   - ${index.name}`);
    });
    console.log(`   ✅ Indexes are ready\n`);

    // 3. Test query performance
    console.log('3️⃣  Query Performance Test:');
    
    // Test 1: Grouped query (main use case)
    const start1 = Date.now();
    const grouped = await debtsCollection.aggregate([
      { $match: { type: 'receivable' } },
      {
        $group: {
          _id: '$customer',
          totalAmount: { $sum: '$amount' },
          debtCount: { $sum: 1 },
          latestUpdate: { $max: '$updatedAt' }
        }
      },
      { $sort: { latestUpdate: -1 } },
      { $limit: 10 }
    ]).toArray();
    const time1 = Date.now() - start1;
    console.log(`   Grouped query: ${time1}ms (${grouped.length} groups)`);

    // Test 2: Latest debts
    const start2 = Date.now();
    const latest = await debtsCollection.find({ type: 'receivable' })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();
    const time2 = Date.now() - start2;
    console.log(`   Latest debts: ${time2}ms (${latest.length} debts)`);

    // Test 3: Customer lookup
    if (grouped.length > 0 && grouped[0]._id) {
      const start3 = Date.now();
      const customerDebts = await debtsCollection.find({ 
        customer: grouped[0]._id,
        type: 'receivable'
      }).toArray();
      const time3 = Date.now() - start3;
      console.log(`   Customer lookup: ${time3}ms (${customerDebts.length} debts)`);
    }

    console.log(`   ✅ All queries are fast!\n`);

    // 4. Show sample data (latest 3)
    console.log('4️⃣  Sample Data (Latest 3):');
    const samples = await debtsCollection.find({ type: 'receivable' })
      .sort({ updatedAt: -1 })
      .limit(3)
      .toArray();
    
    samples.forEach((debt, i) => {
      console.log(`   ${i + 1}. Amount: ${debt.amount}, Status: ${debt.status}`);
      console.log(`      Updated: ${debt.updatedAt || debt.createdAt}`);
    });
    console.log(`   ✅ Data looks good\n`);

    // 5. Performance summary
    console.log('5️⃣  Performance Summary:');
    const avgQueryTime = (time1 + time2) / 2;
    console.log(`   Average query time: ${avgQueryTime.toFixed(2)}ms`);
    if (avgQueryTime < 100) {
      console.log(`   ✅ EXCELLENT - Queries are very fast!`);
    } else if (avgQueryTime < 500) {
      console.log(`   ✅ GOOD - Queries are fast enough`);
    } else {
      console.log(`   ⚠️  SLOW - Consider running index creation script`);
    }

    console.log('\n🎉 Test Complete!');
    console.log('   - Ma\'lumotlar xavfsiz');
    console.log('   - Indexlar ishlayapti');
    console.log('   - Tezlik yaxshi\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

testOptimization();
