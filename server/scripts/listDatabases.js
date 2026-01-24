/**
 * List All Databases in MongoDB Atlas
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function listDatabases() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_uz';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected\n');

    // List all databases
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();
    
    console.log(`📊 Found ${databases.length} databases:\n`);
    console.log('='.repeat(60));
    
    for (const db of databases) {
      console.log(`  ${db.name}`);
      console.log(`    Size: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
      console.log(`    Empty: ${db.empty ? 'Yes' : 'No'}`);
      console.log('');
    }
    
    console.log('='.repeat(60));

    // Check each database for products collection
    console.log('\n🔍 Checking for products in each database...\n');
    
    for (const db of databases) {
      if (db.name === 'admin' || db.name === 'local' || db.name === 'config') {
        continue; // Skip system databases
      }
      
      try {
        const database = mongoose.connection.client.db(db.name);
        const collections = await database.listCollections().toArray();
        const hasProducts = collections.some(c => c.name === 'products');
        
        if (hasProducts) {
          const productCount = await database.collection('products').countDocuments();
          console.log(`  ✅ ${db.name}: ${productCount} products`);
        } else {
          console.log(`  ❌ ${db.name}: No products collection`);
        }
      } catch (err) {
        console.log(`  ⚠️  ${db.name}: Error checking - ${err.message}`);
      }
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run check
listDatabases();
