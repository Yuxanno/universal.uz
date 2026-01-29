const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('./src/models/Customer');

async function checkCustomers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    const customers = await Customer.find().limit(10);
    console.log(`\n📊 Total customers: ${await Customer.countDocuments()}`);
    console.log('\n👥 First 10 customers:');
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} - ${c.phone} (ID: ${c._id})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCustomers();
