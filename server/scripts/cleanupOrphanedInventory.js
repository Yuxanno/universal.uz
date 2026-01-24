const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const WarehouseInventory = require('../src/models/WarehouseInventory');

async function cleanupOrphanedInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n🔄 Cleaning up orphaned inventory...\n');
    
    // Find all inventory with null product
    const orphaned = await WarehouseInventory.find({ product: null });
    console.log(`Found ${orphaned.length} orphaned records`);
    
    if (orphaned.length > 0) {
      for (const inv of orphaned) {
        console.log(`   Deleting: ${inv._id}`);
        await WarehouseInventory.findByIdAndDelete(inv._id);
      }
      console.log(`\n✅ Deleted ${orphaned.length} orphaned inventory records\n`);
    } else {
      console.log('✅ No orphaned inventory found\n');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedInventory();
