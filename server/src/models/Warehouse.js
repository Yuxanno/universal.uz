const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  type: { 
    type: String, 
    enum: ['main', 'seasonal', 'custom'], 
    default: 'custom' 
  },
  isMain: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ensure only one main warehouse
warehouseSchema.pre('save', async function(next) {
  if (this.isMain || this.name === 'Asosiy ombor') {
    this.type = 'main';
    this.isMain = true;
    
    // Remove main flag from other warehouses
    await mongoose.model('Warehouse').updateMany(
      { _id: { $ne: this._id }, isMain: true },
      { $set: { isMain: false, type: 'custom' } }
    );
  }
  next();
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
