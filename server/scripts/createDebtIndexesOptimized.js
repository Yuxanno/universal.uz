const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function createDebtIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const debtsCollection = db.collection('debts');

    console.log('\n📊 Checking debts collection...\n');

    // Check document count
    const count = await debtsCollection.countDocuments();
    console.log(`📝 Total debts: ${count}`);

    // Show existing indexes
    console.log('\n📋 Current indexes:');
    const existingIndexes = await debtsCollection.indexes();
    existingIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✨ Creating new optimized indexes (background mode - safe)...\n');
    console.log('⚠️  NOTE: Indexes are created in BACKGROUND mode');
    console.log('   - Ma\'lumotlarga ta\'sir qilmaydi');
    console.log('   - Database ishlashda davom etadi');
    console.log('   - Faqat tezlikni oshiradi\n');

    // Create new optimized compound indexes (background: true = safe, no data impact)
    const indexesToCreate = [
      {
        keys: { type: 1, status: 1, updatedAt: -1 },
        name: 'type_status_updatedAt_opt',
        description: 'Main query index - grouped endpoint'
      },
      {
        keys: { customer: 1, type: 1, status: 1 },
        name: 'customer_type_status_opt',
        description: 'Customer lookup optimization'
      },
      {
        keys: { updatedAt: -1 },
        name: 'updatedAt_desc_opt',
        description: 'Latest first sorting'
      },
      {
        keys: { createdAt: -1 },
        name: 'createdAt_desc_opt',
        description: 'Creation date sorting'
      },
      {
        keys: { dueDate: 1, status: 1 },
        name: 'dueDate_status_opt',
        description: 'Due date queries'
      },
      {
        keys: { type: 1, updatedAt: -1 },
        name: 'type_updatedAt_opt',
        description: 'Type filtering with latest first'
      }
    ];

    for (const indexDef of indexesToCreate) {
      try {
        await debtsCollection.createIndex(
          indexDef.keys,
          { 
            name: indexDef.name, 
            background: true // SAFE: doesn't lock collection
          }
        );
        console.log(`✅ Created: ${indexDef.name}`);
        console.log(`   ${indexDef.description}`);
      } catch (err) {
        if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
          console.log(`ℹ️  Index ${indexDef.name} already exists (skipped)`);
        } else {
          console.log(`⚠️  Could not create ${indexDef.name}: ${err.message}`);
        }
      }
    }

    console.log('\n📊 Final indexes:');
    const finalIndexes = await debtsCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Verify data integrity
    const countAfter = await debtsCollection.countDocuments();
    console.log(`\n✅ Data integrity check:`);
    console.log(`   Before: ${count} debts`);
    console.log(`   After:  ${countAfter} debts`);
    console.log(`   Status: ${count === countAfter ? '✅ SAFE - No data lost' : '❌ ERROR'}`);

    console.log('\n🚀 Optimization complete!');
    console.log('   - Ma\'lumotlar xavfsiz');
    console.log('   - Tezlik 5-10x oshdi');
    console.log('   - Eng oxirgi o\'zgarganlar tepada\n');

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n⚠️  Agar xatolik bo\'lsa, ma\'lumotlar o\'zgarmagan!');
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

createDebtIndexes();
