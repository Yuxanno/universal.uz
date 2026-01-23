/**
 * Migration Script: Migrate existing products to new inventory system
 * 
 * This script:
 * 1. Ensures main warehouse exists
 * 2. Creates inventory records for all existing products
 * 3. Links products to main warehouse
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const WarehouseInventory = require('../src/models/WarehouseInventory');

async function migrate() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔗 Connecting to MongoDB...');
    console.log('URI:', mongoUri ? mongoUri.substring(0, 30) + '...' : 'NOT FOUND');
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env file');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');

    // Step 1: Find or create main warehouse
    let mainWarehouse = await Warehouse.findOne({ 
      $or: [
        { name: 'Asosiy ombor' },
        { isMain: true }
      ]
    });

    if (!mainWarehouse) {
      console.log('📦 Creating main warehouse...');
      mainWarehouse = await Warehouse.create({
        name: 'Asosiy ombor',
        address: '',
        type: 'main',
        isMain: true
      });
      console.log('✅ Main warehouse created');
    } else {
      console.log('✅ Main warehouse found:', mainWarehouse.name);
      
      // Ensure it's marked as main
      if (!mainWarehouse.isMain) {
        mainWarehouse.isMain = true;
        mainWarehouse.type = 'main';
        await mainWarehouse.save();
        console.log('✅ Main warehouse updated');
      }
    }

    // Step 2: Get all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Step 3: Create inventory records for each product
    for (const product of products) {
      try {
        // Check if inventory record already exists
        const existingInventory = await WarehouseInventory.findOne({
          product: product._id,
          warehouse: mainWarehouse._id
        });

        if (existingInventory) {
          // Update quantity if different
          if (existingInventory.quantity !== product.quantity) {
            existingInventory.quantity = product.quantity;
            await existingInventory.save();
            updated++;
            console.log(`  ✏️  Updated: ${product.name} (${product.quantity} dona)`);
          } else {
            skipped++;
          }
        } else {
          // Create new inventory record
          await WarehouseInventory.create({
            product: product._id,
            warehouse: mainWarehouse._id,
            quantity: product.quantity || 0,
            minStock: product.minStock || 5
          });
          created++;
          console.log(`  ✅ Created: ${product.name} (${product.quantity || 0} dona)`);
        }

        // Update product's warehouse reference if not set
        if (!product.warehouse || product.warehouse.toString() !== mainWarehouse._id.toString()) {
          product.warehouse = mainWarehouse._id;
          product.isMainWarehouse = true;
          await product.save();
        }

      } catch (err) {
        console.error(`  ❌ Error processing ${product.name}:`, err.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Created: ${created}`);
    console.log(`  ✏️  Updated: ${updated}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  📦 Total: ${products.length}`);

    console.log('\n✅ Migration completed successfully!');
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run migration
migrate();
