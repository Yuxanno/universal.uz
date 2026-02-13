const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  code: String,
  price: Number,
  quantity: Number
});

const receiptSchema = new mongoose.Schema({
  items: [cartItemSchema],
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'mixed', 'debt'], default: 'cash' },
  cashAmount: { type: Number, default: 0 },
  cardAmount: { type: Number, default: 0 },
  debtAmount: { type: Number, default: 0 },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected', 'completed', 'archived', 'sent_to_kassa', 'returned'], default: 'completed' },
  isReturn: { type: Boolean, default: false },
  description: { type: String }, // Description for return records (customer name + date + total)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: {
    offlineId: { type: String, index: true },
    syncedAt: { type: Date }
  }
}, { timestamps: true });

// Performance indexes for fast queries
receiptSchema.index({ status: 1, isReturn: 1, createdAt: -1 }); // For history queries
receiptSchema.index({ createdAt: -1 }); // For sorting by date
receiptSchema.index({ customer: 1, createdAt: -1 }); // For customer history

module.exports = mongoose.model('Receipt', receiptSchema);
