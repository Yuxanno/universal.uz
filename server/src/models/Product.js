const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  costPrice: { type: Number, default: 0 },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 }, // Количество проданных единиц
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  isMainWarehouse: { type: Boolean, default: false },
  category: String,
  images: [{ type: String }], // Array of image paths
  minStock: { type: Number, default: 5 },
  // Package/batch information
  packages: [{
    packageCount: { type: Number, required: true }, // Nechta qop
    unitsPerPackage: { type: Number, required: true }, // Har qopda nechta
    totalCost: { type: Number, required: true }, // Jami narxi
    costPerUnit: { type: Number, required: true }, // Bir dona narxi
    dateAdded: { type: Date, default: Date.now }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Create unique index for name (case-insensitive)
productSchema.index({ name: 1 }, { 
  unique: true, 
  collation: { locale: 'en', strength: 2 } // Case-insensitive unique
});

// Compound index for warehouse + code (for faster queries)
productSchema.index({ warehouse: 1, code: 1 });

// Pre-save middleware to normalize name
productSchema.pre('save', function(next) {
  if (this.name) {
    this.name = this.name.trim();
  }
  if (this.code) {
    this.code = this.code.trim();
  }
  next();
});

// Pre-update middleware to normalize name
productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.name) {
    update.name = update.name.trim();
  }
  if (update.code) {
    update.code = update.code.trim();
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
