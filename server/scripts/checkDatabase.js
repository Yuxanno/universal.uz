/**
 * Check Database Collections and Counts
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_uz';
    console.log('🔌 Connecting to MongoDB...');
    console.log('URI:', mongoUri.replace(/:[^:@]+@/, ':****@')); // Hide password
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected\n');

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}\n`);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.length}\n`);

    if (collections.length === 0) {
      console.log('⚠️  No collections found in database!');
      console.log('\nPossible reasons:');
      console.log('  1. Database is empty');
      console.log('  2. Wrong database name in connection string');
      console.log('  3. Data was deleted or never migrated');
      return;
    }

    // Count documents in each collection
    console.log('Collection counts:');
    console.log('='.repeat(50));
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count}`);
    }
    
    console.log('='.repeat(50));

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run check
checkDatabase();
