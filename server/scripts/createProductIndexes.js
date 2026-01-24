const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../src/models/Product');

async function createIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/universal-bozor');
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Creating indexes for Product collection...');
    
    // Drop existing indexes (except _id)
    console.log('🗑️  Dropping old indexes...');
    await Product.collection.dropIndexes();
    console.log('✅ Old indexes dropped');
    
    // Create new indexes
    console.log('\n📝 Creating new indexes...');
    
    // 1. Code index (unique)
    await Product.collection.createIndex({ code: 1 }, { unique: true });
    console.log('✅ Created index: code (unique)');
    
    // 2. Name index (unique, case-insensitive)
    await Product.collection.createIndex(
      { name: 1 }, 
      { unique: true, collation: { locale: 'en', strength: 2 } }
    );
    console.log('✅ Created index: name (unique, case-insensitive)');
    
    // 3. Warehouse index
    await Product.collection.createIndex({ warehouse: 1 });
    console.log('✅ Created index: warehouse');
    
    // 4. Compound index: warehouse + code
    await Product.collection.createIndex({ warehouse: 1, code: 1 });
    console.log('✅ Created index: warehouse + code');
    
    // 5. Sort index: soldCount + createdAt
    await Product.collection.createIndex({ soldCount: -1, createdAt: -1 });
    console.log('✅ Created index: soldCount + createdAt (for sorting)');
    
    // 6. Text index for search
    await Product.collection.createIndex({ name: 'text', code: 'text' });
    console.log('✅ Created index: text search (name + code)');
    
    // List all indexes
    console.log('\n📋 Current indexes:');
    const indexes = await Product.collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
    });
    
    // Test query performance
    console.log('\n⚡ Testing query performance...');
    const startTime = Date.now();
    const products = await Product.find({ warehouse: { $exists: true } })
      .select('name code price warehouse')
      .populate('warehouse', 'name')
      .sort({ soldCount: -1, createdAt: -1 })
      .lean()
      .limit(100);
    const endTime = Date.now();
    
    console.log(`✅ Query completed in ${endTime - startTime}ms`);
    console.log(`📦 Found ${products.length} products`);
    
    console.log('\n✅ All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createIndexes();
