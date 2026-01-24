const mongoose = require('mongoose');

// Ombor-Mahsulot bog'lanishi (Warehouse-Product relationship)
const warehouseInventorySchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  warehouse: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Warehouse', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 0,
    min: [0, 'Miqdor manfiy bo\'lishi mumkin emas']
  },
  minStock: { 
    type: Number, 
    default: 5 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Compound unique index: bir mahsulot bir omborga faqat bir marta qo'shilishi mumkin
warehouseInventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });

// Index for faster queries
warehouseInventorySchema.index({ warehouse: 1 });
warehouseInventorySchema.index({ product: 1 });

// Update lastUpdated on save
warehouseInventorySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('WarehouseInventory', warehouseInventorySchema);
