/**
 * Script to create unique indexes for Product collection
 * Run this once to ensure database-level duplicate prevention
 * 
 * Usage: node server/scripts/createProductIndexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-system';

async function createIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    console.log('\n📊 Checking existing indexes...');
    const existingIndexes = await productsCollection.indexes();
    console.log('Existing indexes:', existingIndexes.map(idx => idx.name));

    // Drop old indexes if they exist (except _id)
    console.log('\n🗑️  Dropping old indexes...');
    try {
      await productsCollection.dropIndex('name_1');
      console.log('✅ Dropped old name_1 index');
    } catch (err) {
      console.log('ℹ️  name_1 index does not exist');
    }

    // Create unique index for code (if not exists)
    console.log('\n🔨 Creating unique index for code...');
    try {
      await productsCollection.createIndex(
        { code: 1 }, 
        { 
          unique: true,
          name: 'code_unique'
        }
      );
      console.log('✅ Created unique index for code');
    } catch (err) {
      console.log('ℹ️  Code index already exists');
    }

    // Create case-insensitive unique index for name
    console.log('\n🔨 Creating case-insensitive unique index for name...');
    try {
      await productsCollection.createIndex(
        { name: 1 }, 
        { 
          unique: true,
          collation: { locale: 'en', strength: 2 },
          name: 'name_unique_case_insensitive'
        }
      );
      console.log('✅ Created case-insensitive unique index for name');
    } catch (err) {
      if (err.code === 11000) {
        console.log('⚠️  Duplicate names found! Cannot create unique index.');
        console.log('   Please remove duplicate products first.');
        
        // Find duplicates
        const duplicates = await productsCollection.aggregate([
          {
            $group: {
              _id: { $toLower: '$name' },
              count: { $sum: 1 },
              docs: { $push: { _id: '$_id', name: '$name', code: '$code' } }
            }
          },
          { $match: { count: { $gt: 1 } } }
        ]).toArray();

        if (duplicates.length > 0) {
          console.log('\n📋 Duplicate products found:');
          duplicates.forEach(dup => {
            console.log(`\n   Name: "${dup._id}" (${dup.count} copies)`);
            dup.docs.forEach(doc => {
              console.log(`      - ID: ${doc._id}, Code: ${doc.code}, Name: ${doc.name}`);
            });
          });
        }
      } else {
        console.error('❌ Error creating name index:', err.message);
      }
    }

    // Create compound index for warehouse + code
    console.log('\n🔨 Creating compound index for warehouse + code...');
    try {
      await productsCollection.createIndex(
        { warehouse: 1, code: 1 },
        { name: 'warehouse_code' }
      );
      console.log('✅ Created compound index for warehouse + code');
    } catch (err) {
      console.log('ℹ️  Warehouse+code index already exists');
    }

    // Show final indexes
    console.log('\n📊 Final indexes:');
    const finalIndexes = await productsCollection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✅ Index creation completed successfully!');
    console.log('\n⚠️  IMPORTANT: If you saw duplicate warnings above,');
    console.log('   please remove duplicate products manually from the database.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createIndexes();
