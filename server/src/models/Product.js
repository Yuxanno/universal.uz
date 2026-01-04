const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  costPrice: { type: Number, default: 0 },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  isMainWarehouse: { type: Boolean, default: false },
  category: String,
  images: [{ type: String }], // Array of image paths
  minStock: { type: Number, default: 5 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
