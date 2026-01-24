const mongoose = require('mongoose');

// Transfer (o'tkazish) log
const warehouseTransferSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  fromWarehouse: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Warehouse', 
    required: true 
  },
  toWarehouse: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Warehouse', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: [1, 'Transfer miqdori kamida 1 bo\'lishi kerak']
  },
  type: {
    type: String,
    enum: ['export', 'import', 'internal'],
    required: true
  },
  transferredBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  }
}, { timestamps: true });

// Indexes for faster queries
warehouseTransferSchema.index({ product: 1 });
warehouseTransferSchema.index({ fromWarehouse: 1 });
warehouseTransferSchema.index({ toWarehouse: 1 });
warehouseTransferSchema.index({ transferredBy: 1 });
warehouseTransferSchema.index({ createdAt: -1 });
warehouseTransferSchema.index({ type: 1 });

// Pre-save middleware to automatically determine transfer type
warehouseTransferSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Warehouse = mongoose.model('Warehouse');
    const [fromWh, toWh] = await Promise.all([
      Warehouse.findById(this.fromWarehouse),
      Warehouse.findById(this.toWarehouse)
    ]);
    
    if (fromWh && toWh) {
      if (fromWh.isMain && !toWh.isMain) {
        this.type = 'export'; // Main → Sub
      } else if (!fromWh.isMain && toWh.isMain) {
        this.type = 'import'; // Sub → Main
      } else {
        this.type = 'internal'; // Sub → Sub or Main → Main
      }
    }
  }
  next();
});

module.exports = mongoose.model('WarehouseTransfer', warehouseTransferSchema);
