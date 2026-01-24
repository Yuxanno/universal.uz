const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');

async function checkWarehouseDistribution() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all warehouses
    const warehouses = await Warehouse.find({}).lean();
    console.log(`📦 Total warehouses: ${warehouses.length}\n`);

    // Get all products
    const allProducts = await Product.find({}).populate('warehouse', 'name').lean();
    console.log(`📊 Total products: ${allProducts.length}\n`);

    // Group products by warehouse
    const distribution = {};
    let noWarehouse = 0;

    for (const product of allProducts) {
      if (!product.warehouse) {
        noWarehouse++;
      } else {
        const warehouseId = product.warehouse._id.toString();
        const warehouseName = product.warehouse.name || 'Unknown';
        
        if (!distribution[warehouseId]) {
          distribution[warehouseId] = {
            name: warehouseName,
            count: 0,
            products: []
          };
        }
        distribution[warehouseId].count++;
        distribution[warehouseId].products.push({
          code: product.code,
          name: product.name,
          quantity: product.quantity
        });
      }
    }

    // Display distribution
    console.log('📊 WAREHOUSE DISTRIBUTION:\n');
    console.log('='.repeat(60));
    
    for (const [warehouseId, data] of Object.entries(distribution)) {
      console.log(`\n🏢 ${data.name} (${warehouseId})`);
      console.log(`   Products: ${data.count}`);
      console.log(`   Sample products (first 5):`);
      data.products.slice(0, 5).forEach(p => {
        console.log(`      - ${p.code}: ${p.name} (qty: ${p.quantity})`);
      });
    }

    if (noWarehouse > 0) {
      console.log(`\n⚠️  Products without warehouse: ${noWarehouse}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total products: ${allProducts.length}`);
    console.log(`   Products with warehouse: ${allProducts.length - noWarehouse}`);
    console.log(`   Products without warehouse: ${noWarehouse}`);
    console.log(`   Warehouses with products: ${Object.keys(distribution).length}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkWarehouseDistribution();
