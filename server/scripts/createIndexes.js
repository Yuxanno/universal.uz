const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models to register schemas
const Product = require('../src/models/Product');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function createIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Recreating indexes...\n');

    // Drop and recreate Product indexes
    console.log('Dropping old Product indexes...');
    try {
      await Product.collection.dropIndexes();
      console.log('✅ Old Product indexes dropped');
    } catch (err) {
      console.log('⚠️  No old indexes to drop');
    }
    
    console.log('Creating new Product indexes...');
    await Product.createIndexes();
    console.log('✅ Product indexes created');

    // Drop and recreate WarehouseInventory indexes
    console.log('\nDropping old WarehouseInventory indexes...');
    try {
      await WarehouseInventory.collection.dropIndexes();
      console.log('✅ Old WarehouseInventory indexes dropped');
    } catch (err) {
      console.log('⚠️  No old indexes to drop');
    }
    
    console.log('Creating new WarehouseInventory indexes...');
    await WarehouseInventory.createIndexes();
    console.log('✅ WarehouseInventory indexes created');

    // List all indexes
    console.log('\n📋 Current indexes:\n');
    
    const productIndexes = await Product.collection.getIndexes();
    console.log('Product indexes:', Object.keys(productIndexes));
    
    const inventoryIndexes = await WarehouseInventory.collection.getIndexes();
    console.log('WarehouseInventory indexes:', Object.keys(inventoryIndexes));

    console.log('\n✅ All indexes created successfully!');
    console.log('\n💡 Tip: Restart your server to apply changes');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

createIndexes();
