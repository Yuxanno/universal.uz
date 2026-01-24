const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Warehouse = require('../src/models/Warehouse');

async function listWarehouses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const warehouses = await Warehouse.find({});
    console.log('\n📦 WAREHOUSES:\n');
    warehouses.forEach(w => {
      console.log(`ID: ${w._id}`);
      console.log(`Name: ${w.name}`);
      console.log(`Address: ${w.address || 'N/A'}`);
      console.log(`Type: ${w.type || 'N/A'}`);
      console.log(`IsMain: ${w.isMain || false}`);
      console.log('-'.repeat(50));
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listWarehouses();
